import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous net returns need an explicit target, and never use a power rail as a return", () => {
  for (const explicit of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="20mm" routingDisabled>
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          maxDecouplingTraceLength="5.5mm"
          decouplingFor={explicit ? ".U1 > .VDD" : undefined}
          decouplingTo={explicit ? ".U1 > .GND" : undefined}
        />
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ 1: "VDD", 4: "GND" }}
          pinAttributes={{
            VDD: { requiresPower: true },
            GND: { requiresGround: true },
          }}
        />
        <chip
          name="U2"
          footprint="soic8"
          pinLabels={{ 1: "VDD", 4: "GND" }}
          pinAttributes={{
            VDD: { requiresPower: true },
            GND: { requiresGround: true },
          }}
        />
        <trace from=".C1 > .pin1" to=".U1 > .VDD" />
        <trace name="SECONDARY_SUPPLY" from=".C1 > .pin1" to=".U2 > .VDD" />
        <trace name="RETURN" from=".C1 > .pin2" to="net.GND" />
        <trace name="RAIL" from=".C1 > .pin1" to="net.VCC" />
        <trace from=".U1 > .GND" to="net.GND" />
        <trace from=".U2 > .GND" to="net.GND" />
      </board>,
    )
    circuit.render()
    const trace = circuit.db.source_trace.getWhere({ name: "RETURN" })!
    expect(trace.max_length).toBe(explicit ? 5.5 : undefined)
    expect(
      circuit.db.source_trace.getWhere({ name: "RAIL" })?.max_length,
    ).toBeUndefined()
    expect(
      circuit.db.source_trace.getWhere({ name: "SECONDARY_SUPPLY" })
        ?.max_length,
    ).toBe(explicit ? undefined : 5.5)
    if (explicit) {
      const target = circuit.db.source_port.get(
        trace.max_length_constraint!.source_port_ids![1],
      )!
      expect(
        circuit.db.source_component.get(target.source_component_id!)?.name,
      ).toBe("U1")
      expect(target.name).toBe("GND")
    }
  }
})
