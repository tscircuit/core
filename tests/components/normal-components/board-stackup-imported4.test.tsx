import { expect, test } from "bun:test"
import { jlc08141h1080Stackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("an imported board without thickness resolves its default 1.4mm stackup", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      circuitJson={
        simpleCircuitJson.map((element) =>
          element.type === "pcb_board"
            ? { ...element, num_layers: 8, thickness: undefined }
            : element,
        ) as any
      }
      fabricatorPreset="jlcpcb_standard"
      layers={8}
    />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.4)
  expect(circuit.db.pcb_stackup.list()).toMatchObject([
    { layers: jlc08141h1080Stackup.layers },
  ])
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
