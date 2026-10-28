import type {
  AnyCircuitElement,
  CadExplosionMove,
  CadExplosionStage,
} from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { resolveAssemblyExplosionRecords } from "./resolve-assembly-explosion-records"

/** Compatibility exporter for already-settled trees from older core releases.
 * Current core emits records through CadExplosionStageRender/CadExplosionRender.
 * World-space XYZ translations are right-handed, millimeters, +Z above.
 * This adapter never participates in getCircuitJson or normal rendering. */
export function serializeAssemblyExplosion(
  roots: readonly PrimitiveComponent[],
  assembled: AnyCircuitElement[],
): (CadExplosionStage | CadExplosionMove)[] {
  let nextStageId = 0
  const records = resolveAssemblyExplosionRecords(
    roots,
    assembled,
    () => `cad_explosion_stage_${nextStageId++}`,
  )
  const stageOrderById = new Map(
    [...records.stages.values()].map((stage) => [
      stage.cad_explosion_stage_id,
      stage.order,
    ]),
  )
  return [
    ...records.stages.values(),
    ...[...records.moves.values()].map((move) => ({
      ...move,
      cad_explosion_move_id: `cad_explosion_move_${stageOrderById.get(move.cad_explosion_stage_id)}_${move.order}`,
    })),
  ]
}
