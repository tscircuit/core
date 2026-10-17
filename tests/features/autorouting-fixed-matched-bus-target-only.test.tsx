import { expect, test } from "bun:test"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an absolute target matches pending copper while preserving fixed members", async () => {
  const { circuit } = getTestFixture()
  let phaseStarts = 0
  circuit.on("autorouting:start", () => phaseStarts++)
  addFixedMatchedBus(circuit, {
    matched: false,
    targetLength: 28,
    lengthTolerance: 0.1,
    explanation: "A targetLength-only bus still constrains every member",
  })
  await circuit.renderUntilSettled()
  expect(phaseStarts).toBe(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.source_bus.list()[0].source_trace_ids).toHaveLength(2)
  const lengths = circuit.db.pcb_trace
    .list()
    .map((trace) => getTraceLength(trace.route))
  expect(Math.min(...lengths)).toBeGreaterThanOrEqual(27.9 - 1e-9)
  expect(Math.max(...lengths)).toBeLessThanOrEqual(28.1 + 1e-9)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
