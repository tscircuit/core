import {
  cad_explosion_collision_error,
  cad_explosion_collision_check_warning,
  type AnyCircuitElement,
  type CadExplosionCollisionCheckWarning,
} from "circuit-json"
import type { ManifoldToplevel, Vec3 } from "manifold-3d"
import {
  CadCollisionCheckingSolver,
  loadCollisionManifold,
  serializeCollisionMesh,
  type CollisionSolidId,
} from "@tscircuit/cad-collision-checking"
import { getCircuitJsonAssemblyExplosion } from "./get-circuit-json-assembly-explosion"
import { createCadCollisionSolid } from "./collision/create-cad-collision-solid"
import { createBoardCollisionSolid } from "./collision/create-board-collision-solid"
import type {
  AssemblyExplosionCollisionCheck,
  ExplosionCollisionSolid,
  ExplosionCadId,
  ExplosionBoardId,
} from "./collision/types"

const getCollisionSolidId = (
  obstacle: ExplosionCollisionSolid["reference"],
): CollisionSolidId =>
  obstacle.type === "cad_component"
    ? `cad_component:${obstacle.cad_component_id}`
    : `pcb_board:${obstacle.pcb_board_id}`

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
    const solidsById = new Map(
      solids.map((solid) => [getCollisionSolidId(solid.reference), solid]),
    )
    const stagesById = new Map(
      stages.map((stage) => [stage.cad_explosion_stage_id, stage]),
    )
    const movesById = new Map(
      moves.map((move) => [move.cad_explosion_move_id, move]),
    )
    const solver = new CadCollisionCheckingSolver(
      {
        solids: solids.map((solid) => ({
          solidId: getCollisionSolidId(solid.reference),
          name: solid.name,
          mesh: serializeCollisionMesh(solid.solid),
        })),
        moves: stages.flatMap((stage) =>
          moves
            .filter(
              (move) =>
                move.cad_explosion_stage_id === stage.cad_explosion_stage_id,
            )
            .sort((a, b) => a.order - b.order)
            .map((move) => ({
              moveId: move.cad_explosion_move_id,
              name: stage.name,
              translation: [
                move.translation.x,
                move.translation.y,
                move.translation.z,
              ] as Vec3,
              solidIds: [
                ...new Set(
                  move.targets.flatMap((target) =>
                    target.type === "cad_component"
                      ? [target.cad_component_id]
                      : target.type === "cad_explosion_stage"
                        ? stagesById.get(target.cad_explosion_stage_id)!
                            .cad_component_ids
                        : [],
                  ),
                ),
              ]
                .map((cad_component_id) =>
                  getCollisionSolidId({
                    type: "cad_component",
                    cad_component_id,
                  }),
                )
                // Missing geometry is already represented by an incomplete warning.
                .filter((solidId) => solidsById.has(solidId)),
            })),
        ),
      },
      { manifold },
    )
    try {
      solver.solve()
      for (const collision of solver.getOutput().collisions) {
        const move = movesById.get(collision.moveId)!
        const stage = stagesById.get(move.cad_explosion_stage_id)!
        const moving = solidsById.get(collision.movingSolidId)!
        const obstacle = solidsById.get(collision.obstacleSolidId)!
        if (moving.reference.type !== "cad_component") continue
        result.errors.push(
          cad_explosion_collision_error.parse({
            type: "cad_explosion_collision_error",
            cad_explosion_stage_id: stage.cad_explosion_stage_id,
            cad_explosion_move_id: move.cad_explosion_move_id,
            moving_cad_component_id: moving.reference.cad_component_id,
            obstacle: obstacle.reference,
            source_component_ids: [
              ...new Set([
                moving.sourceComponentId!,
                ...(obstacle.sourceComponentId
                  ? [obstacle.sourceComponentId]
                  : []),
              ]),
            ],
            swept_intersection_volume_mm3: collision.sweptIntersectionVolumeMm3,
            message: `Explosion stage "${stage.name}" moves "${moving.name}" through "${obstacle.name}"`,
            is_fatal: false,
          }),
        )
      }
    } finally {
      solver.dispose()
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
