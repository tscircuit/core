import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("omitted thickness emits a 1.4mm board without a mismatched stackup", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={20}
      fabricatorPreset="jlcpcb_standard"
      layers={4}
      material="fr4"
    />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0]!.thickness).toBe(1.4)
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
