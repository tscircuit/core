import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-stackup", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard stackup={false}>
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
    "<signalintegrity.simulation> needs a stackup: set fabricatorPreset or define one.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
