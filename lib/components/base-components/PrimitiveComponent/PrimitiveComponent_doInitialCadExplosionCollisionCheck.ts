import {
  cad_explosion_collision_check_warning,
  type AnyCircuitElement,
  type CadExplosionCollisionError,
  type CadExplosionCollisionCheckWarning,
} from "circuit-json"
import type { AssemblyExplosionCollisionCheckStatus } from "lib/assembly-explosion/collision/types"
import type { PrimitiveComponent } from "./PrimitiveComponent"

interface ExplosionCollisionRenderState {
  key: string
  status: AssemblyExplosionCollisionCheckStatus
  errorIds: CadExplosionCollisionError["cad_explosion_collision_error_id"][]
  warningIds: CadExplosionCollisionCheckWarning["cad_explosion_collision_check_warning_id"][]
}
const states = new WeakMap<PrimitiveComponent, ExplosionCollisionRenderState>()

const collisionInput = (records: AnyCircuitElement[]) =>
  records.filter((record) =>
    [
      "cad_component",
      "cad_reference_surface",
      "cad_explosion_stage",
      "cad_explosion_move",
      "cad_explosion_geometry_state",
      "cad_explosion_contact_annotation",
      "pcb_board",
      "pcb_hole",
      "pcb_plated_hole",
      "pcb_cutout",
      "pcb_via",
      "pcb_bend",
      "pcb_component",
      "source_component",
    ].includes((record as { type: string }).type),
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
  }
  states.set(component, state)
  if (!input.some((record) => record.type === "cad_explosion_move")) return
  state.status = "pending"
  component._queueAsyncEffect(
    "check-assembly-explosion-collisions",
    async () => {
      let check
      try {
        const { checkCircuitJsonAssemblyExplosionCollisions } = await import(
          "lib/assembly-explosion/check-circuit-json-assembly-explosion-collisions"
        )
        check = await checkCircuitJsonAssemblyExplosionCollisions(input, {
          projectBaseUrl: root.platform?.projectBaseUrl,
        })
      } catch {
        check = {
          status: "incomplete" as const,
          verificationCategory: "incomplete" as const,
          errors: [],
          annotatedContacts: [],
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
      for (const error of check.errors)
        state.errorIds.push(
          root.db.cad_explosion_collision_error.insert(error)
            .cad_explosion_collision_error_id,
        )
      for (const contact of check.annotatedContacts)
        state.errorIds.push(
          root.db.cad_explosion_collision_error.insert({
            ...contact.diagnostic,
            verification_status: "annotated_unverified_contact",
            is_annotated_contact: true,
            contact_annotation_id: contact.annotationId,
            rationale: contact.rationale,
            ...(contact.operation ? { operation: contact.operation } : {}),
            measured_bounds: contact.measuredBounds,
          } as unknown as CadExplosionCollisionError)
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
