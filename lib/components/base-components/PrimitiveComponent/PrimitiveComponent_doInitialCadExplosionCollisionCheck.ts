import {
  cad_assembly_collision_check_warning,
  cad_explosion_collision_check_warning,
  type AnyCircuitElement,
  type CadAssemblyCollisionError,
  type CadAssemblyCollisionCheckWarning,
  type CadExplosionCollisionError,
  type CadExplosionCollisionCheckWarning,
} from "circuit-json"
import type { AssemblyExplosionCollisionCheckStatus } from "lib/assembly-explosion/collision/types"
import { getAssemblyBoardCollisionGeometry } from "lib/assembly-explosion/collision/get-assembly-board-collision-geometry"
import type { PrimitiveComponent } from "./PrimitiveComponent"

interface ExplosionCollisionRenderState {
  key: string
  status: AssemblyExplosionCollisionCheckStatus
  errorIds: CadExplosionCollisionError["cad_explosion_collision_error_id"][]
  warningIds: CadExplosionCollisionCheckWarning["cad_explosion_collision_check_warning_id"][]
  assemblyErrorIds: CadAssemblyCollisionError["cad_assembly_collision_error_id"][]
  assemblyWarningIds: CadAssemblyCollisionCheckWarning["cad_assembly_collision_check_warning_id"][]
}
const states = new WeakMap<PrimitiveComponent, ExplosionCollisionRenderState>()

const collisionInput = (records: AnyCircuitElement[]) =>
  records.filter((record) =>
    [
      "cad_component",
      "cad_reference_surface",
      "cad_explosion_stage",
      "cad_explosion_move",
      "pcb_board",
      "pcb_hole",
      "pcb_plated_hole",
      "pcb_cutout",
      "pcb_via",
      "pcb_bend",
      "pcb_component",
      "source_component",
    ].includes(record.type),
  )

export const getRenderedExplosionCollisionCheckStatus = (
  component?: PrimitiveComponent | null,
): AssemblyExplosionCollisionCheckStatus =>
  component ? (states.get(component)?.status ?? "not_checked") : "not_checked"

export function PrimitiveComponent_removeCadExplosionCollisionCheck(
  component: PrimitiveComponent,
) {
  const state = states.get(component)
  if (state && component.root) {
    for (const id of state.errorIds)
      component.root.db.cad_explosion_collision_error.delete(id)
    for (const id of state.warningIds)
      component.root.db.cad_explosion_collision_check_warning.delete(id)
    for (const id of state.assemblyErrorIds)
      component.root.db.cad_assembly_collision_error.delete(id)
    for (const id of state.assemblyWarningIds)
      component.root.db.cad_assembly_collision_check_warning.delete(id)
  }
  states.delete(component)
}

/** One circuit-wide DRC at the root component, after the CAD/explosion phases.
 * Child dirty phases propagate to this owner; getters never write diagnostics.
 * Repeated renders reuse the check, and stale async results cannot be committed.
 */
export function PrimitiveComponent_doInitialCadExplosionCollisionCheck(
  component: PrimitiveComponent,
) {
  const root = component.root
  if (!root || root.firstChild !== component || root.pcbDisabled) return
  const input = collisionInput(root.db.toArray())
  const key = JSON.stringify(input)
  const prior = states.get(component)
  if (prior?.key === key) return
  PrimitiveComponent_removeCadExplosionCollisionCheck(component)
  const state: ExplosionCollisionRenderState = {
    key,
    status: "not_checked",
    errorIds: [],
    warningIds: [],
    assemblyErrorIds: [],
    assemblyWarningIds: [],
  }
  states.set(component, state)
  const hasMoves = input.some((record) => record.type === "cad_explosion_move")
  const { boards, cad } = getAssemblyBoardCollisionGeometry(input)
  const hasBoardAndPrintedPart = boards.length > 0 && cad.length > 0
  if (!hasMoves && !hasBoardAndPrintedPart) return
  if (hasMoves) state.status = "pending"
  component._queueAsyncEffect(
    "check-assembly-explosion-collisions",
    async () => {
      const options = { projectBaseUrl: root.platform?.projectBaseUrl }
      let assemblyCheck
      if (hasBoardAndPrintedPart) {
        try {
          const { checkCircuitJsonAssemblyCollisions } = await import(
            "lib/assembly-explosion/check-circuit-json-assembly-collisions"
          )
          assemblyCheck = await checkCircuitJsonAssemblyCollisions(
            input,
            options,
          )
        } catch {
          assemblyCheck = {
            errors: [],
            warnings: [
              cad_assembly_collision_check_warning.parse({
                type: "cad_assembly_collision_check_warning",
                cad_component_ids: [],
                pcb_board_ids: [],
                reason: "collision_check_failed",
                message: "Assembled collision checking could not complete",
              }),
            ],
          }
        }
      }
      let check
      if (hasMoves)
        try {
          const { checkCircuitJsonAssemblyExplosionCollisions } = await import(
            "lib/assembly-explosion/check-circuit-json-assembly-explosion-collisions"
          )
          check = await checkCircuitJsonAssemblyExplosionCollisions(
            input,
            options,
          )
        } catch {
          check = {
            status: "incomplete" as const,
            errors: [],
            warnings: [
              cad_explosion_collision_check_warning.parse({
                type: "cad_explosion_collision_check_warning",
                cad_explosion_stage_ids: input
                  .filter((r) => r.type === "cad_explosion_stage")
                  .map((stage) => stage.cad_explosion_stage_id),
                cad_component_ids: [],
                pcb_board_ids: [],
                reason: "collision_check_failed",
                message: "Explosion collision checking could not complete",
                is_fatal: false,
              }),
            ],
          }
        }
      if (states.get(component) !== state || component.shouldBeRemoved) return
      if (JSON.stringify(collisionInput(root.db.toArray())) !== key) {
        states.delete(component)
        component._markDirty("CadExplosionCollisionCheck")
        return
      }
      for (const error of assemblyCheck?.errors ?? [])
        state.assemblyErrorIds.push(
          root.db.cad_assembly_collision_error.insert(error)
            .cad_assembly_collision_error_id,
        )
      for (const warning of assemblyCheck?.warnings ?? [])
        state.assemblyWarningIds.push(
          root.db.cad_assembly_collision_check_warning.insert(warning)
            .cad_assembly_collision_check_warning_id,
        )
      if (!check) return
      for (const error of check.errors)
        state.errorIds.push(
          root.db.cad_explosion_collision_error.insert(error)
            .cad_explosion_collision_error_id,
        )
      for (const warning of check.warnings)
        state.warningIds.push(
          root.db.cad_explosion_collision_check_warning.insert(warning)
            .cad_explosion_collision_check_warning_id,
        )
      state.status = check.status
    },
  )
}
