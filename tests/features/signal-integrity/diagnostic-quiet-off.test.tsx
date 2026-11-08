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
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" quiet="off" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DATA": .TX > .Y model LVC1G04_OUT_33 has no disabled state; use quiet="low" or "high".',
  )
})
