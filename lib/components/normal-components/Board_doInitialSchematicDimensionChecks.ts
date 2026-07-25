import type { AnyCircuitElement } from "circuit-json"
import type { Board } from "./Board"

/**
 * Schematic dimensions that must be greater than zero, per element type.
 *
 * A negative or zero size is accepted silently today — `<chip schWidth={-4} />`
 * emits `size: { width: -4 }` and `<schematiccircle radius={-1} />` emits
 * `radius: -1`, both with no error. The symbol either renders inside-out or
 * disappears, and the user gets no signal at all.
 */
const POSITIVE_SCHEMATIC_FIELDS: Record<string, string[]> = {
  schematic_box: ["width", "height"],
  schematic_rect: ["width", "height"],
  schematic_circle: ["radius"],
  schematic_text: ["font_size"],
}

export const Board_doInitialSchematicDimensionChecks = (board: Board) => {
  if (board.root?.schematicDisabled) return

  const { db } = board.root!
  // Not every schematic primitive carries a `subcircuit_id` (schematic_box, for
  // one), so a subtree query would silently skip them.
  const elements = db.toArray() as AnyCircuitElement[]

  const report = (message: string, propertyName: string) => {
    db.source_invalid_component_property_error.insert({
      error_type: "source_invalid_component_property_error",
      source_component_id: "",
      property_name: propertyName,
      message,
    } as any)
  }

  for (const element of elements as any[]) {
    // schematic_component carries its size in a nested `size` object.
    if (element.type === "schematic_component" && element.size) {
      for (const field of ["width", "height"] as const) {
        const value = element.size[field]
        if (typeof value !== "number" || Number.isNaN(value)) continue
        if (value > 0) continue
        const propName = field === "width" ? "schWidth" : "schHeight"
        report(
          `Invalid ${propName} for schematic_component "${element.schematic_component_id}": ${value}, which must be greater than zero.`,
          propName,
        )
      }
      continue
    }

    const fields = POSITIVE_SCHEMATIC_FIELDS[element.type]
    if (!fields) continue

    for (const field of fields) {
      const value = element[field]
      if (typeof value !== "number" || Number.isNaN(value)) continue
      if (value > 0) continue
      report(
        `Invalid ${field} for ${element.type} "${element[`${element.type}_id`] ?? element.type}": ${value}, which must be greater than zero.`,
        field,
      )
    }
  }
}
