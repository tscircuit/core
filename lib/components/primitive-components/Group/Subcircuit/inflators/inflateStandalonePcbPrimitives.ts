import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import type { InflatorContext } from "../InflatorFn"

/**
 * Inflates standalone PCB primitives (silkscreen, fab notes, pcb notes, etc.)
 * that are placed directly on the board without being associated with a component.
 */
export function inflateStandalonePcbPrimitives(
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  // Get all elements that are standalone primitives
  const standalonePrimitiveTypes = [
    "pcb_silkscreen_rect",
    "pcb_silkscreen_circle",
    "pcb_silkscreen_line",
    "pcb_silkscreen_path",
    "pcb_silkscreen_text",
    "pcb_fabrication_note_text",
    "pcb_fabrication_note_path",
    "pcb_fabrication_note_rect",
    "pcb_note_text",
    "pcb_note_rect",
    "pcb_note_path",
    "pcb_note_line",
  ]

  const standalonePrimitives = injectionDb.toArray().filter(
    (elm) =>
      standalonePrimitiveTypes.includes(elm.type) &&
      // Check for null or undefined pcb_component_id
      "pcb_component_id" in elm &&
      (elm.pcb_component_id === null || elm.pcb_component_id === undefined),
  )

  if (standalonePrimitives.length === 0) return

  // Create components from the standalone primitives
  const components = createComponentsFromCircuitJson(
    {
      componentName: "",
      componentRotation: "0deg",
    },
    standalonePrimitives,
  )

  // Add all inflated components to the subcircuit
  for (const component of components) {
    subcircuit.add(component)
  }
}
