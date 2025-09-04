import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source_trace_id is not correct for the schematic_trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance={1000} schX={-2} />
      <capacitor name="C1" capacitance="1uF" schX={2} />
      <capacitor name="C2" capacitance="1uF" schX={4} />
      <trace from=".R1 .pin2" to=".C1 .pin1" />
      <trace from=".R1 .pin2" to=".C2 .pin1" />
    </board>,
  )

  circuit.render()

  const source_traces = circuit.db.source_trace.list()
  expect(source_traces).toHaveLength(2)
  expect(source_traces.map((t) => t.source_trace_id)).toMatchInlineSnapshot(`
    [
      "source_trace_0",
      "source_trace_1",
    ]
  `)

  const schematic_traces = circuit.db.schematic_trace.list()
  expect(schematic_traces).toHaveLength(2)
  const ids = schematic_traces.map((t) => t.source_trace_id).sort()
  expect(ids).toEqual(["source_trace_0", "source_trace_1"])
})
