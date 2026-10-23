import { expect, test } from "bun:test"
import { getPcbSpiceChannelFixture } from "tests/fixtures/get-pcb-spice-channel-fixture"

test("PCB SPICE supplies connect to existing circuit pins without a PCB component", async () => {
  const { circuit, supply, driverPort, groundPort } =
    await getPcbSpiceChannelFixture()
  const voltageSource = circuit.db.simulation_voltage_source.list()[0]
  const terminal1 = circuit.db.source_port.getWhere({
    source_component_id: supply.source_component_id,
    pin_number: 1,
  })!
  const terminal2 = circuit.db.source_port.getWhere({
    source_component_id: supply.source_component_id,
    pin_number: 2,
  })!
  expect(voltageSource).toMatchObject({
    type: "simulation_voltage_source",
    voltage: 1.5,
    is_dc_source: false,
    terminal1_source_port_id: terminal1.source_port_id,
    terminal2_source_port_id: terminal2.source_port_id,
  })
  expect(terminal1.source_port_id).not.toBe(driverPort.source_port_id)
  for (const [terminal, chipPort] of [
    [terminal1, driverPort],
    [terminal2, groundPort],
  ]) {
    expect(
      circuit.db.source_trace
        .list()
        .some(
          (trace) =>
            trace.connected_source_port_ids.length === 2 &&
            trace.connected_source_port_ids.includes(terminal.source_port_id) &&
            trace.connected_source_port_ids.includes(chipPort.source_port_id),
        ),
    ).toBe(true)
  }
  expect(
    circuit.db.pcb_component.getWhere({
      source_component_id: supply.source_component_id,
    }),
  ).toBeNull()
})
