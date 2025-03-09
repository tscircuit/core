import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("add thickness to the trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
      <capacitor capacitance="1000pF" footprint="0402" name="C2" schX={-3} />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" thickness={1.2} />
      <trace from=".R1 > .pin2" to=".C2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const source_trace = circuit.db.source_trace.list()[0]
  expect(source_trace.min_trace_thickness).toBeDefined()
  expect(source_trace).toMatchInlineSnapshot(`
    {
      "connected_source_net_ids": [],
      "connected_source_port_ids": [
        "source_port_0",
        "source_port_2",
      ],
      "display_name": ".R1 > .pin1 to .C1 > .pin1",
      "max_length": NaN,
      "min_trace_thickness": 1.2,
      "source_trace_id": "source_trace_0",
      "subcircuit_connectivity_map_key": "unnamedsubcircuit47_connectivity_net0",
      "subcircuit_id": "subcircuit_source_group_0",
      "type": "source_trace",
    }
  `)
})
