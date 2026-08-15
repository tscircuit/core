import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "pushbutton side1 and side2 aliases resolve in trace selectors (#3116)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm">
        <pushbutton name="SW1" pcbX={0} pcbY={0} />
        <resistor name="R1" resistance="10k" pcbX={5} pcbY={0} />
        <trace from=".SW1 > .side1" to="net.VCC" />
        <trace from=".SW1 > .side2" to=".R1 > .pin1" />
      </board>,
    )

    circuit.render()

    const traces = circuit.db.source_trace.list()
    expect(traces.length).toBe(2)

    const sw1 = circuit.db.source_component.getWhere({ name: "SW1" })!
    const sw1Port1 = circuit.db.source_port.getWhere({
      source_component_id: sw1.source_component_id,
      pin_number: 1,
    })!
    const sw1Port2 = circuit.db.source_port.getWhere({
      source_component_id: sw1.source_component_id,
      pin_number: 2,
    })!

    const connectedPortIds = traces.flatMap(
      (t) => t.connected_source_port_ids ?? [],
    )
    expect(connectedPortIds).toContain(sw1Port1.source_port_id)
    expect(connectedPortIds).toContain(sw1Port2.source_port_id)
  },
  { timeout: 30000 },
)

test(
  "pushbutton with 4 pins has default internally connected pins (#3115)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm">
        <pushbutton
          name="SW1"
          footprint="pushbutton_id1.3mm_od2mm"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    const sw1Component = circuit.selectAll("pushbutton")[0] as any
    expect(sw1Component.internallyConnectedPinNames).toEqual([
      ["pin1", "pin2"],
      ["pin3", "pin4"],
    ])
  },
  { timeout: 30000 },
)
