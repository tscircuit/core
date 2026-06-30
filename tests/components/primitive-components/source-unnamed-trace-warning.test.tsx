import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unnamed trace emits source_unnamed_trace_warning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  circuit.render()

  const sourceTrace = circuit.db.source_trace.list()[0]
  const warnings = circuit.db.source_unnamed_trace_warning.list()

  expect(warnings).toHaveLength(1)
  expect(warnings[0].source_trace_id).toBe(sourceTrace.source_trace_id)
  expect(warnings[0].warning_type).toBe("source_unnamed_trace_warning")
})
