import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit target selectors identify local pins without pin-name inference", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        maxDecouplingTraceLength="5.5mm"
        decouplingFor=".U1 > .A"
        decouplingTo=".U1 > .B"
      />
      <chip name="U1" footprint="soic8" pinLabels={{ 1: "A", 4: "B" }} />
    </board>,
  )
  circuit.render()
  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(2)
  for (const trace of traces) {
    expect(trace.max_length).toBe(5.5)
    expect(trace.max_length_constraint?.origin).toBe("decoupling")
    expect(trace.max_length_constraint?.source_port_ids).toHaveLength(2)
  }
})
