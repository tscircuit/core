import {
  cad_explosion_move,
  cad_explosion_stage,
  type AnyCircuitElement,
  type CadComponent,
  type CadReferenceSurface,
  type CadExplosionStage,
  type CadExplosionMove,
  type CadExplosionTarget,
  type Point3,
} from "circuit-json"
import type {
  AssemblyExplosionOptions,
  AssemblyExplosionView,
  AssemblyExplosionLine,
} from "./get-assembly-explosion"

type CadId = CadComponent["cad_component_id"]
type SurfaceId = CadReferenceSurface["cad_reference_surface_id"]
type StageId = CadExplosionStage["cad_explosion_stage_id"]
const plus = (a: Point3, b: Point3): Point3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})
const zero = (): Point3 => ({ x: 0, y: 0, z: 0 })

/** Evaluate exported instructions without a TSX tree. Positions and displacement
 * vectors use right-handed circuit-world XYZ in mm, +Z above. Input is assembled
 * geometry and is never mutated. Validate the whole program before playback. */
export function getCircuitJsonAssemblyExplosion(
  assembled: AnyCircuitElement[],
  options: AssemblyExplosionOptions = {},
): AssemblyExplosionView {
  const stages = assembled
    .filter((record) => record.type === "cad_explosion_stage")
    .map((record) => {
      const parsed = cad_explosion_stage.safeParse(record)
      if (!parsed.success) throw new Error("Invalid explosion stage record")
      return parsed.data
    })
    .sort((a, b) => a.order - b.order)
  const moves = assembled
    .filter((record) => record.type === "cad_explosion_move")
    .map((record) => {
      const parsed = cad_explosion_move.safeParse(record)
      if (!parsed.success) throw new Error("Invalid explosion movement record")
      return parsed.data
    })
  const cad = assembled.filter(
    (record): record is CadComponent => record.type === "cad_component",
  )
  const surfaces = assembled.filter(
    (record): record is CadReferenceSurface =>
      record.type === "cad_reference_surface",
  )
  const cadById = new Map(
    cad.map((record) => [record.cad_component_id, record]),
  )
  const surfaceById = new Map(
    surfaces.map((record) => [record.cad_reference_surface_id, record]),
  )
  const stageById = new Map(
    stages.map((stage) => [stage.cad_explosion_stage_id, stage]),
  )
  if (
    cadById.size !== cad.length ||
    surfaceById.size !== surfaces.length ||
    stageById.size !== stages.length ||
    new Set(stages.map((stage) => stage.name)).size !== stages.length ||
    new Set(moves.map((move) => move.cad_explosion_move_id)).size !==
      moves.length
  )
    throw new Error(
      "Explosion document contains duplicate identities or stage names",
    )
  const expand = (targets: CadExplosionTarget[]) => {
    const cadIds = new Set<CadId>()
    const surfaceIds = new Set<SurfaceId>()
    for (const target of targets) {
      if (target.type === "cad_component") cadIds.add(target.cad_component_id)
      else if (target.type === "cad_reference_surface")
        surfaceIds.add(target.cad_reference_surface_id)
      else {
        const stage = stageById.get(target.cad_explosion_stage_id)
        if (!stage)
          throw new Error("Explosion movement references a missing stage")
        for (const id of stage.cad_component_ids) cadIds.add(id)
        for (const id of stage.cad_reference_surface_ids ?? [])
          surfaceIds.add(id)
      }
    }
    return { cadIds, surfaceIds }
  }
  for (const [order, stage] of stages.entries()) {
    if (stage.order !== order)
      throw new Error(
        `Invalid playback order for explosion stage "${stage.name}"`,
      )
    if (
      new Set(stage.cad_component_ids).size !==
        stage.cad_component_ids.length ||
      new Set(stage.cad_reference_surface_ids).size !==
        (stage.cad_reference_surface_ids?.length ?? 0)
    )
      throw new Error(`Duplicate membership in explosion stage "${stage.name}"`)
    for (const id of stage.cad_component_ids) {
      const component = cadById.get(id)
      if (!component)
        throw new Error(`Missing component in explosion stage "${stage.name}"`)
      if (component.pcb_component_id)
        throw new Error(
          `Explosion stage "${stage.name}" includes unsupported PCB geometry`,
        )
      if (
        ![
          component.position.x,
          component.position.y,
          component.position.z,
        ].every(Number.isFinite)
      )
        throw new Error(`Invalid geometry in explosion stage "${stage.name}"`)
    }
    for (const id of stage.cad_reference_surface_ids ?? []) {
      const surface = surfaceById.get(id)
      if (
        !surface ||
        ![surface.center.x, surface.center.y, surface.center.z].every(
          Number.isFinite,
        )
      )
        throw new Error(
          `Missing or invalid reference surface in explosion stage "${stage.name}"`,
        )
    }
  }
  const movesByStage = new Map<StageId, CadExplosionMove[]>()
  for (const move of moves) {
    const owner = stageById.get(move.cad_explosion_stage_id)
    if (!owner) throw new Error("Explosion movement has no executing stage")
    const members = expand(move.targets)
    if (
      [...members.cadIds].some((id) => !owner.cad_component_ids.includes(id)) ||
      [...members.surfaceIds].some(
        (id) => !owner.cad_reference_surface_ids?.includes(id),
      )
    )
      throw new Error(
        `Movement targets are outside explosion stage "${owner.name}"`,
      )
    movesByStage.set(move.cad_explosion_stage_id, [
      ...(movesByStage.get(move.cad_explosion_stage_id) ?? []),
      move,
    ])
  }
  for (const [stageId, stageMoves] of movesByStage) {
    stageMoves.sort((a, b) => a.order - b.order)
    if (stageMoves.some((move, order) => move.order !== order))
      throw new Error(
        `Invalid movement order in explosion stage "${stageById.get(stageId)!.name}"`,
      )
  }
  const progress = options.stageProgress ?? 1
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new Error("Explosion progress must be between zero and one")
  const stop =
    options.throughStageRef === undefined
      ? stages.length - 1
      : stages.findIndex((stage) => stage.name === options.throughStageRef)
  if (options.throughStageRef !== undefined && stop < 0)
    throw new Error("Unknown explosion playback stage")
  const cadOffsets = new Map<CadId, Point3>()
  const surfaceOffsets = new Map<SurfaceId, Point3>()
  const lines: AssemblyExplosionLine[] = []
  for (const [stageIndex, stage] of stages.entries()) {
    if (stageIndex > stop) break
    const stageMoves = movesByStage.get(stage.cad_explosion_stage_id) ?? []
    for (const [moveIndex, move] of stageMoves.entries()) {
      const fraction =
        stageIndex === stop
          ? Math.max(0, Math.min(1, progress * stageMoves.length - moveIndex))
          : 1
      if (!fraction) continue
      const offset = {
        x: move.translation.x * fraction,
        y: move.translation.y * fraction,
        z: move.translation.z * fraction,
      }
      const { cadIds, surfaceIds } = expand(move.targets)
      for (const id of cadIds) {
        const prior = cadOffsets.get(id) ?? zero()
        const from = plus(cadById.get(id)!.position, prior)
        if (Math.hypot(offset.x, offset.y, offset.z))
          lines.push({
            stageRef: stage.name,
            targetRef: id,
            points: [from, plus(from, offset)],
          })
        cadOffsets.set(id, plus(prior, offset))
      }
      for (const id of surfaceIds)
        surfaceOffsets.set(id, plus(surfaceOffsets.get(id) ?? zero(), offset))
    }
  }
  return {
    circuitJson: structuredClone(assembled).map((record) => {
      if (record.type === "cad_component")
        return {
          ...record,
          position: plus(
            record.position,
            cadOffsets.get(record.cad_component_id) ?? zero(),
          ),
        }
      if (record.type === "cad_reference_surface")
        return {
          ...record,
          center: plus(
            record.center,
            surfaceOffsets.get(record.cad_reference_surface_id) ?? zero(),
          ),
        }
      return record
    }),
    stages: stages.map((stage) => stage.name),
    lines,
    collisionCheckStatus: "not_implemented",
  }
}
