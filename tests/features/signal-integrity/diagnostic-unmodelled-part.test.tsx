import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unmodelled-part", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard disconnected>
      <diode name="D5" footprint="sod123" />
      <trace from=".TX > .Y" to=".D5 > .anode" />
      <trace from=".D5 > .cathode" to=".RX > .A" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    '.D5 is on signal "DATA" and has no SPICE or IBIS model.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
