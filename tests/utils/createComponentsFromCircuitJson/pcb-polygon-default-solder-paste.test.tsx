import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a raw polygon footprint receives default paste when no paste is supplied", () => {
  const { circuit } = getTestFixture()
  const primitives = createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0" },
    [
      {
        type: "pcb_smtpad",
        pcb_smtpad_id: "pad_raw",
        shape: "polygon",
        layer: "top",
        port_hints: [],
        points: [
          { x: -2, y: -1 },
          { x: 2, y: -1 },
          { x: 1, y: 1 },
          { x: -2, y: 1 },
        ],
      },
    ],
  )
  const board = new Board({ width: 8, height: 6 })
  const chip = new Chip({ name: "U1" })
  const footprint = new Footprint({})
  circuit.add(board)
  board.add(chip)
  chip.add(footprint)
  footprint.addAll(primitives)
  board.add(
    <pcbnotetext
      text="Raw polygon footprint: default paste is generated"
      pcbY={2.4}
      fontSize={0.2}
    />,
  )
  circuit.render()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(1)
  expect(paste[0]!.shape).toBe("polygon")
  expect(paste[0]!.pcb_smtpad_id).toBe(
    circuit.db.pcb_smtpad.list()[0]!.pcb_smtpad_id,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
