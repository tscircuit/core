import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an imported trace preserves its source trace identity", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        sourceTraceId="source_trace_imported"
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
      <pcbnotetext
        text="Imported source trace identity"
        pcbY={3}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTraceIds = circuit.db.source_trace
    .list()
    .map((trace) => trace.source_trace_id)

  expect(sourceTraceIds[0]).toBe("source_trace_imported")
  expect(sourceTraceIds[1]).toMatch(/^source_trace_\d+$/)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) => trace.source_trace_id === "source_trace_imported"),
  ).toBeTrue()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
