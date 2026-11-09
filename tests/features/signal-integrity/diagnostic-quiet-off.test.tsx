import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("quiet off requires a disabled IBIS driver state", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity.simulation bitRate="20Mbps" unrouted="ideal">
        <signalintegrity.signal
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
          quiet="off"
        />
      </signalintegrity.simulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DATA": .TX > .Y model LVC1G04_OUT_33 has no disabled state; use quiet="low" or "high".',
  )
})
