import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "capacitor creates nets and traces when bypassFor and bypassTo are used (#3107)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm">
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          bypassFor="net.VCC"
          bypassTo="net.GND"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    const sourceTraces = circuit.db.source_trace.list()
    expect(sourceTraces.length).toBeGreaterThanOrEqual(2)

    const connectedPortIds = sourceTraces.flatMap(
      (t) => t.connected_source_port_ids ?? [],
    )
    const connectedNetIds = sourceTraces.flatMap(
      (t) => t.connected_source_net_ids ?? [],
    )

    const c1Ports = circuit.db.source_port.list({
      source_component_id: circuit.db.source_component.getWhere({
        name: "C1",
      })!.source_component_id,
    })

    expect(c1Ports.length).toBeGreaterThanOrEqual(2)
    for (const port of c1Ports) {
      expect(connectedPortIds).toContain(port.source_port_id)
    }

    const vccNet = circuit.db.source_net.getWhere({ name: "VCC" })
    const gndNet = circuit.db.source_net.getWhere({ name: "GND" })
    expect(vccNet).toBeDefined()
    expect(gndNet).toBeDefined()
    expect(connectedNetIds).toContain(vccNet!.source_net_id)
    expect(connectedNetIds).toContain(gndNet!.source_net_id)
  },
  { timeout: 30000 },
)
