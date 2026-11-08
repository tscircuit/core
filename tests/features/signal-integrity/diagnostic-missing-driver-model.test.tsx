import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-driver-model", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard missingModel="TX">
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="D0" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "D0" driver .TX > .Y has no <ibismodel>.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
