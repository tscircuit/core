import { expect, test } from "bun:test"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("incompatible fixed lengths are rejected without changing fixed copper", async () => {
  const { circuit } = getTestFixture()
  const { circuit: baseline } = getTestFixture()
  baseline.pcbRoutingDisabled = true
  let phaseStarts = 0
  circuit.on("autorouting:start", () => phaseStarts++)
  const options = {
    extraFixedLength: 29,
    explanation:
      "Fixed DATA0 = 28 mm / DATA2 = 29 mm already violate 0.1 mm skew",
  }
  addFixedMatchedBus(circuit, options)
  addFixedMatchedBus(baseline, options)
  await baseline.renderUntilSettled()
  await circuit.renderUntilSettled()
  expect(phaseStarts).toBe(0)
  expect(circuit.db.pcb_trace.list()).toEqual(baseline.db.pcb_trace.list())
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message: expect.stringContaining(
        'pre-routed members "DATA0" (28.000 mm) and "DATA2" (29.000 mm)',
      ),
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
