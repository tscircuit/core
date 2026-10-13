import { expect, test } from "bun:test"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"

test("multiple pending members match both fixed copper and each other", async () => {
  const { circuit } = getTestFixture()
  const { circuit: baseline } = getTestFixture()
  baseline.pcbRoutingDisabled = true
  const options = {
    extraPending: true,
    explanation:
      "Fixed DATA0 = 28 mm; both pending 20 mm members must tune within 0.1 mm",
  }
  addFixedMatchedBus(circuit, options)
  addFixedMatchedBus(baseline, options)
  await baseline.renderUntilSettled()
  await circuit.renderUntilSettled()
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(3)
  expect(traces[0]).toEqual(baseline.db.pcb_trace.list()[0])
  const lengths = traces.map((trace) => getTraceLength(trace.route))
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
    0.100000001,
  )
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
