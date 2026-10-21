import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("an imported board without a preset emits no stackup", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      circuitJson={
        simpleCircuitJson.map((element) =>
          element.type === "pcb_board"
            ? { ...element, num_layers: 4, thickness: 1.6, material: "fr4" }
            : element,
        ) as any
      }
    />,
  )
  await circuit.renderUntilSettled()
  const stackups = circuit.db.pcb_stackup.list()
  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(stackups).toHaveLength(0)
})
