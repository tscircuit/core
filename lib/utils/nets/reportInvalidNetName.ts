import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/**
 * Reports an invalid net name as a recoverable circuit-json error attached to
 * the offending component, so a single bad net name surfaces as a fixable
 * warning instead of an exception that aborts the whole render.
 *
 * If there is no database to attach the error to (e.g. the component is not
 * mounted to a root circuit, or `preprocessSelector` was called standalone),
 * we fall back to throwing so the problem isn't silently swallowed.
 */
export const reportInvalidNetName = (
  component: PrimitiveComponent | undefined,
  selector: string,
  message: string,
): void => {
  const db = component?.root?.db
  if (!db) {
    throw new Error(message)
  }

  const sourceComponentId = component!.source_component_id || ""

  // Avoid inserting the same error repeatedly across render cycles
  const alreadyReported = db.source_invalid_component_property_error
    .list()
    .some(
      (err) =>
        err.property_name === "net" &&
        err.property_value === selector &&
        err.source_component_id === sourceComponentId,
    )
  if (alreadyReported) return

  db.source_invalid_component_property_error.insert({
    source_component_id: sourceComponentId,
    subcircuit_id: component!.getSubcircuit()?.subcircuit_id ?? undefined,
    property_name: "net",
    property_value: selector,
    message,
    error_type: "source_invalid_component_property_error",
  })
}
