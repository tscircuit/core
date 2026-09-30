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
      <pcbnotetext
        text="Imported source trace identity"
        pcbY={3}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace.list()[0]?.source_trace_id).toBe(
    "source_trace_imported",
  )
  expect(circuit.db.pcb_trace.list()[0]?.source_trace_id).toBe(
    "source_trace_imported",
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
