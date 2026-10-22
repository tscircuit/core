import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unsupported 4-layer 1.5mm fr4 construction emits no stackup or error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={20}
      fabricatorPreset="jlcpcb_standard"
      layers={4}
      thickness={1.5}
      material="fr4"
    />,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
