import { expect, test } from "bun:test"
import BenchSupplyStatusIndicator from "tests/fixtures/bench-supply-status-indicator"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduce supply legend rotation on Bench Supply Status Indicator", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<BenchSupplyStatusIndicator />)
  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
