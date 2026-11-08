import { expect } from "bun:test"
import { lvcModel, lvcPins } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI subcircuits use their destination board with isolation caching enabled or disabled", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <board routingDisabled fabricatorPreset="jlcpcb_standard">
        <subcircuit name="OUTER" _subcircuitCachingEnabled={cached}>
          <subcircuit name="SI">
            <chip name="TX" footprint="sot23_5" pinLabels={lvcPins} pcbX={-5} />
            <chip name="RX" footprint="sot23_5" pinLabels={lvcPins} pcbX={5} />
            <ibismodel componentRef=".TX" {...lvcModel} />
            <ibismodel componentRef=".RX" {...lvcModel} />
            <trace from=".TX > .Y" to=".RX > .A" />
            <signalintegrity bitRate="20Mbps" unrouted="ideal">
              <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
            </signalintegrity>
          </subcircuit>
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_stackup.list()).toHaveLength(1)
    expect(circuit.db.simulation_signal.list()).toHaveLength(1)
    expect(circuit.db.simulation_signal.list()[0].seed).toBe(127)
  }
})
