import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import {
  pcb_note_dimension,
  pcb_fabrication_note_dimension,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imports PCB note and fabrication dimensions", async () => {
  const { circuit } = getTestFixture()
  const footprint = [
    pcb_note_dimension.parse({
      type: "pcb_note_dimension",
      from: { x: -3, y: 2 },
      to: { x: 3, y: 2 },
      text: "Imported PCB note",
      layer: "top",
      font_size: 0.5,
      offset_distance: 0.5,
    }),
    pcb_fabrication_note_dimension.parse({
      type: "pcb_fabrication_note_dimension",
      pcb_component_id: "input_component",
      from: { x: -3, y: -2 },
      to: { x: 3, y: -2 },
      text: "Imported fabrication",
      layer: "top",
      font_size: 0.5,
      offset: 0.5,
    }),
  ]
  circuit.add(
    <board width={12} height={10} routingDisabled schematicDisabled>
      <chip name="U1" footprint={footprint as unknown as FootprintProp} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_note_dimension.list()).toHaveLength(1)
  expect(circuit.db.pcb_fabrication_note_dimension.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
