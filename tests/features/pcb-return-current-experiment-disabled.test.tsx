import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB-disabled TSX skips return-current experiment declarations", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={8} height={6}>
      <pcbreturncurrentsimulation name="Pending return path" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(0)
  expect(circuit.db.simulation_pcb_return_current_result.list()).toHaveLength(0)
})
