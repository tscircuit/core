import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI topology stops at a passive tied to a power net", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard disconnected>
      <voltagesource
        name="V1"
        voltage="3.3V"
        connections={{ pin1: "net.CUSTOM_SUPPLY", pin2: "net.GND" }}
      />
      <resistor name="RPULL" resistance="10k" footprint="0402" />
      <trace from=".TX > .Y" to=".RPULL > .pin1" />
      <trace from=".RPULL > .pin2" to="net.CUSTOM_SUPPLY" />
      <trace from=".RX > .A" to="net.CUSTOM_SUPPLY" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Receiver .RX > .A is not connected to the copper of signal "DATA".',
  )
})
