import {
  cad_explosion_collision_error,
  cad_explosion_collision_check_warning,
  type AnyCircuitElement,
  type CadExplosionCollisionCheckWarning,
} from "circuit-json"
import type { Manifold, ManifoldToplevel, Vec3 } from "manifold-3d"
import { getCircuitJsonAssemblyExplosion } from "./get-circuit-json-assembly-explosion"
import { createCadCollisionSolid } from "./collision/create-cad-collision-solid"
import { createBoardCollisionSolid } from "./collision/create-board-collision-solid"
import { createTranslationSweep } from "./collision/create-translation-sweep"
import { loadCollisionManifold } from "./collision/load-collision-manifold"
import type {
  AssemblyExplosionCollisionCheck,
  ExplosionCollisionSolid,
  ExplosionCadId,
  ExplosionBoardId,
} from "./collision/types"

const boundsOverlap = (
  a: ReturnType<Manifold["boundingBox"]>,
  b: ReturnType<Manifold["boundingBox"]>,
) =>
  [0, 1, 2].every(
    (axis) => a.min[axis] < b.max[axis] && b.min[axis] < a.max[axis],
  )

/** Check the entire serialized explosion program without mutating its geometry.
 * All solids/points and translations use right-handed Circuit JSON world mm
 * (+X right, +Y top, +Z above). Movements are continuous straight translations;
 * each stage's moves execute sequentially and each move's targets move together.
 * Initial occupied space is subtracted per move, allowing parts to separate from
 * existing overlaps. Only newly entered positive-volume intersections are errors.
 * Unsupported/invalid geometry yields explicit incomplete-check warnings.
 */
export async function checkCircuitJsonAssemblyExplosionCollisions(
  circuitJson: AnyCircuitElement[],
  options: { manifold?: ManifoldToplevel } = {},
): Promise<AssemblyExplosionCollisionCheck> {
  // Use the playback validator before looking at any geometry or partial path.
  getCircuitJsonAssemblyExplosion(circuitJson)
  const stages = circuitJson
    .filter((r) => r.type === "cad_explosion_stage")
    .sort((a, b) => a.order - b.order)
  const moves = circuitJson.filter((r) => r.type === "cad_explosion_move")
  const result: AssemblyExplosionCollisionCheck = {
    status: "checked",
    errors: [],
    warnings: [],
  }
  if (
    !moves.some((move) =>
      Math.hypot(move.translation.x, move.translation.y, move.translation.z),
    )
  )
    return result
  const stageIds = stages.map((stage) => stage.cad_explosion_stage_id)
  const sources = new Map(
    circuitJson
      .filter((r) => r.type === "source_component")
      .map((source) => [source.source_component_id, source.name]),
  )
  const solids: ExplosionCollisionSolid[] = []
  const unavailable = new Map<
    CadExplosionCollisionCheckWarning["reason"],
    {
      cad_component_ids: ExplosionCadId[]
      pcb_board_ids: ExplosionBoardId[]
      names: string[]
    }
  >()
  const skip = (
    reason: CadExplosionCollisionCheckWarning["reason"],
    reference: ExplosionCollisionSolid["reference"],
    name: string,
  ) => {
    const group = unavailable.get(reason) ?? {
      cad_component_ids: [],
      pcb_board_ids: [],
      names: [],
    }
    if (reference.type === "cad_component")
      group.cad_component_ids.push(reference.cad_component_id)
    else group.pcb_board_ids.push(reference.pcb_board_id)
    group.names.push(name)
    unavailable.set(reason, group)
  }
  const manifold = options.manifold ?? (await loadCollisionManifold())
  try {
    for (const record of circuitJson) {
      if (record.type === "cad_component") {
        const reference = {
          type: "cad_component" as const,
          cad_component_id: record.cad_component_id,
        }
        const name = sources.get(record.source_component_id) || "unnamed part"
        if (
          !record.model_jscad ||
          record.model_stl_url ||
          record.model_obj_url ||
          record.model_gltf_url ||
          record.model_glb_url ||
          record.model_step_url ||
          record.model_wrl_url ||
          record.model_3mf_url ||
          record.model_asset
        ) {
          skip("unsupported_geometry", reference, name)
          continue
        }
        try {
          solids.push({
            reference,
            name,
            sourceComponentId: record.source_component_id,
            solid: createCadCollisionSolid(record, circuitJson, manifold),
          })
        } catch {
          skip("invalid_geometry", reference, name)
        }
      } else if (record.type === "pcb_board") {
        const reference = {
          type: "pcb_board" as const,
          pcb_board_id: record.pcb_board_id,
        }
        try {
          const solid = createBoardCollisionSolid(record, circuitJson, manifold)
          if (solid) solids.push({ reference, name: "PCB", solid })
          else skip("unsupported_geometry", reference, "PCB")
        } catch {
          skip("invalid_geometry", reference, "PCB")
        }
      }
    }
    const cadSolids = new Map<ExplosionCadId, ExplosionCollisionSolid>()
    for (const entry of solids)
      if (entry.reference.type === "cad_component")
        cadSolids.set(entry.reference.cad_component_id, entry)
    const stagesById = new Map(
      stages.map((stage) => [stage.cad_explosion_stage_id, stage]),
    )
    for (const stage of stages) {
      const stageMoves = moves
        .filter(
          (move) =>
            move.cad_explosion_stage_id === stage.cad_explosion_stage_id,
        )
        .sort((a, b) => a.order - b.order)
      for (const move of stageMoves) {
        const displacement: Vec3 = [
          move.translation.x,
          move.translation.y,
          move.translation.z,
        ]
        if (!Math.hypot(...displacement)) continue
        const moved = new Set<ExplosionCadId>()
        for (const target of move.targets) {
          if (target.type === "cad_component")
            moved.add(target.cad_component_id)
          else if (target.type === "cad_explosion_stage")
            for (const id of stagesById.get(target.cad_explosion_stage_id)!
              .cad_component_ids)
              moved.add(id)
        }
        // All parts in one move have zero relative displacement. Exclude them
        // together, including duplicated/overlapping whole-stage memberships.
        const obstacles = solids.filter(
          (entry) =>
            entry.reference.type === "pcb_board" ||
            !moved.has(entry.reference.cad_component_id),
        )
        for (const cadId of moved) {
          const moving = cadSolids.get(cadId)
          if (!moving) continue
          const bounds = moving.solid.boundingBox()
          const sweptBounds = {
            min: bounds.min.map(
              (v, axis) => v + Math.min(0, displacement[axis]),
            ) as Vec3,
            max: bounds.max.map(
              (v, axis) => v + Math.max(0, displacement[axis]),
            ) as Vec3,
          }
          const candidates = obstacles.filter((obstacle) =>
            boundsOverlap(sweptBounds, obstacle.solid.boundingBox()),
          )
          if (!candidates.length) continue
          const sweep = createTranslationSweep(
            moving.solid,
            displacement,
            manifold,
          )
          let entered: Manifold | undefined
          try {
            entered = sweep.subtract(moving.solid)
            if (entered.status() !== "NoError")
              throw new Error("Could not evaluate newly swept geometry")
            for (const obstacle of candidates) {
              const intersection = entered.intersect(obstacle.solid)
              try {
                if (intersection.status() !== "NoError")
                  throw new Error("Could not intersect explosion solids")
                const volume = intersection.volume()
                // Ignore rounding at touching faces. The threshold follows the
                // kernel's linear tolerance and intersected surface area, in mm³.
                const threshold = Math.max(
                  1e-9,
                  intersection.tolerance() * intersection.surfaceArea(),
                )
                if (volume <= threshold) continue
                result.errors.push(
                  cad_explosion_collision_error.parse({
                    type: "cad_explosion_collision_error",
                    cad_explosion_stage_id: stage.cad_explosion_stage_id,
                    cad_explosion_move_id: move.cad_explosion_move_id,
                    moving_cad_component_id: cadId,
                    obstacle: obstacle.reference,
                    source_component_ids: [
                      ...new Set([
                        moving.sourceComponentId!,
                        ...(obstacle.sourceComponentId
                          ? [obstacle.sourceComponentId]
                          : []),
                      ]),
                    ],
                    swept_intersection_volume_mm3: volume,
                    message: `Explosion stage "${stage.name}" moves "${moving.name}" through "${obstacle.name}"`,
                    is_fatal: false,
                  }),
                )
              } finally {
                intersection.delete()
              }
            }
          } finally {
            entered?.delete()
            sweep.delete()
          }
        }
        // Apply each shared translation once, after every pair has been checked
        // against the same pre-move scene. Subsequent moves use these new poses.
        for (const cadId of moved) {
          const entry = cadSolids.get(cadId)
          if (!entry) continue
          const translated = entry.solid.translate(displacement)
          try {
            if (translated.status() !== "NoError")
              throw new Error("Could not translate explosion solid")
          } catch (error) {
            translated.delete()
            throw error
          }
          entry.solid.delete()
          entry.solid = translated
        }
      }
    }
    for (const [reason, group] of unavailable) {
      const names = [...new Set(group.names)]
      const description = names
        .slice(0, 6)
        .map((name) => `"${name}"`)
        .join(", ")
      const remaining =
        names.length > 6 ? ` and ${names.length - 6} other parts` : ""
      result.warnings.push(
        cad_explosion_collision_check_warning.parse({
          type: "cad_explosion_collision_check_warning",
          cad_explosion_stage_ids: stageIds,
          cad_component_ids: group.cad_component_ids,
          pcb_board_ids: group.pcb_board_ids,
          reason,
          message: `Explosion collision checking is incomplete: could not check ${description}${remaining}`,
          is_fatal: false,
        }),
      )
    }
    if (result.warnings.length) result.status = "incomplete"
    return result
  } finally {
    for (const { solid } of solids) solid.delete()
  }
}
