import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro53: connectivity id in schematic trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance={1000} schX={-2} />
      <resistor name="R2" resistance={1000} schX={2} schY={-1} />
      <capacitor name="C1" capacitance="1uF" schX={2} />
      <capacitor name="C2" capacitance="1uF" schX={4} />
      {/* Same net */}
      <trace from=".R1 .pin2" to=".C1 .pin1" />
      <trace from=".R1 .pin2" to=".C2 .pin2" />
      {/* Different Net */}
      <trace from=".R2 .pin2" to=".C1 .pin2" />
    </board>,
  )

  circuit.render()

  const source_traces = circuit.db.source_trace.list()
  expect(source_traces).toHaveLength(3)
  expect(source_traces.map((t) => t.subcircuit_connectivity_map_key)).toMatchInlineSnapshot(`
    [
      "unnamedsubcircuit15_connectivity_net0",
      "unnamedsubcircuit15_connectivity_net0",
      "unnamedsubcircuit15_connectivity_net1",
    ]
  `)

  const schematic_traces = circuit.db.schematic_trace.list()
  expect(schematic_traces).toHaveLength(3)
  const ids = schematic_traces.map((t) => t.subcircuit_connectivity_map_key).sort()
  expect(ids).toMatchInlineSnapshot(`
    [
      "unnamedsubcircuit15_connectivity_net0",
      "unnamedsubcircuit15_connectivity_net0",
      "unnamedsubcircuit15_connectivity_net1",
    ]
  `)
})