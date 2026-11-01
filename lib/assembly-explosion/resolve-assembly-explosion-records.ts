import type {
  AnyCircuitElement,
  CadExplosionMove,
  CadExplosionStage,
  CadExplosionTarget,
} from "circuit-json"
import { mat3, mat4, vec3 } from "gl-matrix"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { AssemblyExplosionStage } from "lib/components/primitive-components/AssemblyExplosionStage"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import {
  isPositionedAssembly,
  resolveAssemblyPlacement,
} from "lib/components/primitive-components/resolve-assembly-placement"
import {
  assemblyPath,
  resolveAssemblyExplosionStages,
} from "./get-assembly-explosion"

type StageId = CadExplosionStage["cad_explosion_stage_id"]

/** Export resolved instructions after CAD placement. Displacements are vectors
 * in right-handed circuit-world XYZ, mm, +X right, +Y top, +Z above. */
export function resolveAssemblyExplosionRecords(
  roots: readonly PrimitiveComponent[],
  assembled: AnyCircuitElement[],
  getStageId: (stage: AssemblyExplosionStage) => StageId,
) {
  const ordered = resolveAssemblyExplosionStages(roots)
  const stages: CadExplosionStage[] = ordered.map((stage, order) => ({
    type: "cad_explosion_stage",
    cad_explosion_stage_id: getStageId(stage),
    name: `${assemblyPath(stage.parent!)}.${stage.name}`,
    order,
    cad_component_ids: [],
    cad_reference_surface_ids: [],
  }))
  const moves: Omit<CadExplosionMove, "cad_explosion_move_id">[] = []
  const moveComponents: AssemblyExplosionMove[] = []
  for (const [stageIndex, stage] of ordered.entries()) {
    const owner = stage.parent!
    const placement = isPositionedAssembly(owner)
      ? resolveAssemblyPlacement(owner)
      : undefined
    // Same resolved frame used by getAssemblyExplosion; vectors omit translation.
    const frame = placement?.worldTransform
      ? mat4.clone(placement.worldTransform)
      : mat4.create()
    if (placement && !placement.worldTransform) {
      mat4.rotateZ(frame, frame, (placement.pcbRotation * Math.PI) / 180)
      if (placement.layer === "bottom") mat4.rotateY(frame, frame, Math.PI)
    }
    for (const [order, instruction] of stage.children
      .filter((child) => !child.shouldBeRemoved)
      .entries()) {
      const move = instruction as AssemblyExplosionMove
      const targets: CadExplosionTarget[] = []
      for (const targetRef of move._parsedProps.targetRefs) {
        const qualified = `${assemblyPath(owner)}.${targetRef}`
        const targetStage = stages.find(
          (candidate) =>
            candidate.name === qualified ||
            (targetRef.startsWith(`${assemblyPath(owner).split(".")[0]}.`) &&
              candidate.name === targetRef),
        )
        let target = owner
        let matchedPart = true
        let matchCount = 0
        for (const segment of targetRef.split(".")) {
          const matches = target.children.filter(
            (part) =>
              !part.shouldBeRemoved &&
              part.name === segment &&
              [
                "AssemblyPart",
                "AssemblyPrintedPart",
                "AssemblySubassembly",
                "AssemblyScreen",
                "AssemblyMotor",
              ].includes(part.componentName),
          )
          matchCount = matches.length
          if (matches.length !== 1) {
            matchedPart = false
            break
          }
          target = matches[0]
        }
        if (targetStage && matchedPart)
          throw new Error(
            `Ambiguous explosion target "${targetRef}" names both a part and a stage`,
          )
        if (targetStage) {
          targets.push({
            type: "cad_explosion_stage",
            cad_explosion_stage_id: targetStage.cad_explosion_stage_id,
          })
          continue
        }
        if (!matchedPart)
          throw new Error(
            `Explosion stage "${stages[stageIndex].name}" target "${targetRef}" matched ${matchCount} assembly parts; expected one or a matching stage`,
          )
        const descendants = [target, ...target.getDescendants()]
        if (
          descendants.some(
            (part) =>
              part.pcb_component_id ||
              part.componentName === "Board" ||
              part.componentName === "AssemblyCable",
          )
        )
          throw new Error(
            `Explosion target "${targetRef}" includes unsupported PCB or cable geometry`,
          )
        const sources = new Set(
          descendants.map((part) => part.source_component_id).filter(Boolean),
        )
        const geometry = assembled.filter(
          (record) =>
            (record.type === "cad_component" ||
              record.type === "cad_reference_surface") &&
            sources.has(record.source_component_id),
        )
        if (!geometry.length)
          throw new Error(
            `Explosion target "${targetRef}" has no emitted geometry`,
          )
        for (const record of geometry) {
          if (record.type === "cad_component")
            targets.push({
              type: "cad_component",
              cad_component_id: record.cad_component_id,
            })
          if (record.type === "cad_reference_surface")
            targets.push({
              type: "cad_reference_surface",
              cad_reference_surface_id: record.cad_reference_surface_id,
            })
        }
      }
      const displacement = vec3.transformMat3(
        vec3.create(),
        [
          move._parsedProps.offX ?? 0,
          move._parsedProps.offY ?? 0,
          move._parsedProps.offZ ?? 0,
        ],
        mat3.fromMat4(mat3.create(), frame),
      )
      moveComponents.push(move)
      moves.push({
        type: "cad_explosion_move",
        cad_explosion_stage_id: stages[stageIndex].cad_explosion_stage_id,
        order,
        targets,
        translation: {
          x: displacement[0],
          y: displacement[1],
          z: displacement[2],
        },
      })
    }
  }
  // A TSX stage's membership is the union of its authored targets. Resolve stage
  // references once on export; JSON playback only uses explicit membership.
  const resolved = new Set<StageId>()
  const visiting = new Set<StageId>()
  const resolveMembership = (stage: CadExplosionStage) => {
    if (resolved.has(stage.cad_explosion_stage_id)) return
    if (visiting.has(stage.cad_explosion_stage_id))
      throw new Error(`Explosion stage membership cycle at "${stage.name}"`)
    visiting.add(stage.cad_explosion_stage_id)
    const cad = new Set(stage.cad_component_ids)
    const surfaces = new Set(stage.cad_reference_surface_ids)
    for (const move of moves.filter(
      (move) => move.cad_explosion_stage_id === stage.cad_explosion_stage_id,
    )) {
      for (const target of move.targets) {
        if (target.type === "cad_component") cad.add(target.cad_component_id)
        else if (target.type === "cad_reference_surface")
          surfaces.add(target.cad_reference_surface_id)
        else {
          const memberStage = stages.find(
            (candidate) =>
              candidate.cad_explosion_stage_id ===
              target.cad_explosion_stage_id,
          )!
          resolveMembership(memberStage)
          for (const id of memberStage.cad_component_ids) cad.add(id)
          for (const id of memberStage.cad_reference_surface_ids ?? [])
            surfaces.add(id)
        }
      }
    }
    stage.cad_component_ids = [...cad]
    stage.cad_reference_surface_ids = [...surfaces]
    visiting.delete(stage.cad_explosion_stage_id)
    resolved.add(stage.cad_explosion_stage_id)
  }
  for (const stage of stages) resolveMembership(stage)
  return {
    stages: new Map(ordered.map((stage, i) => [stage, stages[i]])),
    moves: new Map(moveComponents.map((move, i) => [move, moves[i]])),
  }
}
