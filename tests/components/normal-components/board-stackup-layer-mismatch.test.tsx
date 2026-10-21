import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a preset with a different copper layer count emits a placement error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      name="Main"
      width={20}
      height={20}
      layers={2}
      stackupPreset="JLC04161H-3313"
    />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toMatchObject([
    {
      error_type: "pcb_placement_error",
      subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
      message:
        'Stackup preset "JLC04161H-3313" requires 4 copper layers, but board "Main" has 2 layers. Set layers={4} or choose a matching stackup preset.',
    },
  ])
})
