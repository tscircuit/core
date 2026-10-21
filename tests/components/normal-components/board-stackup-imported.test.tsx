import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("a preset emits one stackup for an imported board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      circuitJson={simpleCircuitJson as any}
      layers={4}
      stackupPreset="JLC04161H-3313"
    />,
  )
  await circuit.renderUntilSettled()
  const stackups = circuit.db.pcb_stackup.list()
  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(stackups).toHaveLength(1)
  expect(stackups[0]).toMatchObject({
    pcb_board_id: circuit.db.pcb_board.list()[0]!.pcb_board_id,
    layers: expect.arrayContaining([
      {
        layer_type: "copper",
        layer: "inner1",
        thickness: 0.0152,
        electrical_conductivity_s_per_m: 5.8e7,
      },
    ]),
  })
})
