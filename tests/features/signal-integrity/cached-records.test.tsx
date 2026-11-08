import { expect } from "bun:test"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"
import { Inverter, Octal } from "./fixtures/parts"

test("cached SI source records remap endpoint and forward strobe references", async () => {
  const { circuit: original } = getSiTestFixture()
  original.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      <Inverter name="TX0" pcbX={-8} pcbY={2} />
      <Octal />
      <Inverter name="TX1" pcbX={-8} pcbY={-2} />
      <trace from=".TX0 > .Y" to=".RX > .A1" />
      <trace from=".TX1 > .Y" to=".RX > .A2" />
      <signalintegrity name="WRITE" bitRate="20Mbps" unrouted="ideal">
        <signal
          name="DATA"
          driver=".TX0 > .Y"
          receiver=".RX > .A1"
          strobe="CLK"
          mask={{ setup: "75ps" }}
        />
        <signal
          name="CLK"
          driver=".TX1 > .Y"
          receiver=".RX > .A2"
          pattern="clock"
        />
      </signalintegrity>
    </board>,
  )
  await original.renderUntilSettled()
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled fabricatorPreset="jlcpcb_standard">
      <subcircuit name="A" pcbX={-20} circuitJson={original.getCircuitJson()} />
      <subcircuit name="B" pcbX={20} circuitJson={original.getCircuitJson()} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const blocks = circuit.db.simulation_signal_integrity.list()
  expect(blocks).toHaveLength(2)
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(6)
  const driverPorts = []
  for (const block of blocks) {
    const signals = circuit.db.simulation_signal.list({
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
    })
    expect(signals.map((signal) => signal.name)).toEqual(["DATA", "CLK"])
    expect(signals[0].strobe_simulation_signal_id).toBe(
      signals[1].simulation_signal_id,
    )
    for (const signal of signals) {
      if (signal.driver.kind !== "single")
        throw new Error("Expected a single-ended fixture")
      driverPorts.push(signal.driver.source_port_id)
      expect(
        circuit.db.source_port.get(signal.driver.source_port_id),
      ).not.toBeNull()
    }
  }
  expect(new Set(driverPorts).size).toBe(4)
})
