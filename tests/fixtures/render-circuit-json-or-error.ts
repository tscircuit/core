import type { AnyCircuitElement } from "circuit-json"
import type { ReactElement } from "react"
import { getTestFixture } from "./get-test-fixture"

/**
 * Render a circuit to Circuit JSON for a PCB snapshot. When Core rejects the
 * circuit, return an otherwise empty PCB that shows the first sentence of the
 * error, so a repro can snapshot today's failure and its fix can update that
 * same snapshot to the working output.
 */
export const renderCircuitJsonOrError = async (
  element: ReactElement,
): Promise<AnyCircuitElement[]> => {
  const { circuit } = getTestFixture()
  try {
    circuit.add(element)
    await circuit.renderUntilSettled()
    return circuit.getCircuitJson()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [
      {
        type: "pcb_note_text",
        pcb_note_text_id: "pcb_note_text_render_error",
        text: `RENDER ERROR: ${message.split(". ")[0]}`,
        anchor_position: { x: 0, y: 0 },
        anchor_alignment: "center",
        font: "tscircuit2024",
        font_size: 0.6,
        layer: "top",
      },
    ]
  }
}
