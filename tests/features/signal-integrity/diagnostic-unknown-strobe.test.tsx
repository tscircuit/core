import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unknown-strobe", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity name="WRITE" bitRate="20Mbps" unrouted="ideal">
        <signal name="DQ0" driver=".TX > .Y" receiver=".RX > .A" strobe="DQS" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DQ0" strobe "DQS" is not a signal in block "WRITE".',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
