import { signalintegrity } from "lib/namespaced-elements"
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
      <signalintegrity.simulation bitRate="20Mbps" unrouted="ideal">
        <signalintegrity.signal
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </signalintegrity.simulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    '.D5 is on signal "DATA" and has no SPICE or IBIS model.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
