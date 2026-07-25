/**
 * Normalizes an id that may be `null` into `undefined`.
 *
 * `PrimitiveComponent` initialises its id fields to `null`
 * (`pcb_component_id: string | null = null`), but circuit-json types every id
 * as `z.string().optional()` — which accepts `undefined` and rejects `null`.
 *
 * Primitives placed directly on a board have no owning `pcb_component`, so the
 * `null` was reaching circuit JSON and making the whole element fail
 * `any_circuit_element.parse()`.
 */
export const optionalId = (id: string | null | undefined): string | undefined =>
  id ?? undefined
