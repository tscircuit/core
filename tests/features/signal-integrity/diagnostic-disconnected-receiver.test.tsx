import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: disconnected-receiver", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard disconnected>
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
    'Receiver .RX > .A is not connected to the copper of signal "DATA".',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
