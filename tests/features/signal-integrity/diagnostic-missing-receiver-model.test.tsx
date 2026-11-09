import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-receiver-model", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard missingModel="RX">
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
    'Signal "DATA" receiver .RX > .A has no <signalintegrity.ibismodel>.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
