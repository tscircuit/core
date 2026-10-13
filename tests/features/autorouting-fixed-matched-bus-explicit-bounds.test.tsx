import { expect, test } from "bun:test"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit bounds match pending copper against compatible fixed members", async () => {
  const { circuit } = getTestFixture()
  const { circuit: manualBaseline } = getTestFixture()
  manualBaseline.pcbRoutingDisabled = true
  let phaseStarts = 0
  circuit.on("autorouting:start", () => phaseStarts++)
  const options = {
    targetLength: 28.025,
    lengthTolerance: 0.075,
    extraFixedLength: 28.05,
    explanation:
      "Fixed 28 / 28.05 mm; pending member tunes into 27.95–28.10 mm",
  }
  addFixedMatchedBus(circuit, options)
  addFixedMatchedBus(manualBaseline, options)
  await manualBaseline.renderUntilSettled()
  await circuit.renderUntilSettled()
  expect(phaseStarts).toBe(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const fixedIds = manualBaseline.db.pcb_trace
    .list()
    .map((trace) => trace.source_trace_id)
  const fixedTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => fixedIds.includes(trace.source_trace_id))
  expect(fixedTraces).toEqual(manualBaseline.db.pcb_trace.list())
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.source_bus.list()[0].source_trace_ids).toHaveLength(3)
  const lengths = circuit.db.pcb_trace
    .list()
    .map((trace) => getTraceLength(trace.route))
  expect(Math.min(...lengths)).toBeGreaterThanOrEqual(27.95 - 1e-9)
  expect(Math.max(...lengths)).toBeLessThanOrEqual(28.1 + 1e-9)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
