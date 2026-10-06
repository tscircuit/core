import { Chip } from "lib/components/normal-components/Chip"
import { Board } from "lib/components/normal-components/Board/Board"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { FabricationNoteText } from "lib/components/primitive-components/FabricationNoteText"
import { expect, test } from "bun:test"
import type { PcbFabricationNotePath } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

test("Circuit JSON fabrication path flags survive component reconstruction", async () => {
  const { circuit } = getTestFixture()
  const path: PcbFabricationNotePath = {
    type: "pcb_fabrication_note_path",
    pcb_fabrication_note_path_id: "filled-path",
    pcb_component_id: "pcb_component_1",
    layer: "top",
    route: [
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 2 },
      { x: -2, y: 2 },
    ],
    stroke_width: 0,
    is_filled: true,
    has_stroke: false,
  }
  const primitives = createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0deg" },
    [path],
  )
  const footprint = new Footprint({})
  for (const primitive of primitives) footprint.add(primitive)
  footprint.add(
    new FabricationNoteText({
      text: "RECONSTRUCTED FILL",
      pcbY: 3,
      fontSize: 0.4,
      anchorAlignment: "center",
    }),
  )
  const chip = new Chip({ name: "U1" })
  chip.add(footprint)
  const board = new Board({ width: 10, height: 10 })
  board.add(chip)
  circuit.add(board)
  circuit.render()
  const [rendered] = circuit.db.pcb_fabrication_note_path.list()
  expect(rendered).toMatchObject({
    is_filled: true,
    has_stroke: false,
    stroke_width: 0,
    route: path.route,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
