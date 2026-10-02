import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A process-global display ID makes the same real warning differ on each render.
test("identical circuits emit identical unnamed-trace warning messages", () => {
  const messages = Array.from({ length: 3 }, () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="20mm" routingDisabled>
        <resistor name="R1" resistance="10k" footprint="0402" />
        <resistor name="R2" resistance="10k" footprint="0402" />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        <trace name="signal" from=".R1 > .pin2" to=".R2 > .pin2" />
        <trace from=".R1 > .pin2" to="net.GND" />
      </board>,
    )
    circuit.render()

    const warnings = circuit.db.source_unnamed_trace_warning.list()
    expect(circuit.db.source_trace.list()).toHaveLength(3)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].warning_type).toBe("source_unnamed_trace_warning")
    expect(warnings[0].source_trace_id).toBe(
      circuit.db.source_trace.list()[0].source_trace_id,
    )
    expect(warnings[0].message).toContain("is missing a name")
    return warnings[0].message
  })

  expect(messages).toEqual([messages[0], messages[0], messages[0]])
})
