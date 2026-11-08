import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-stackup", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard stackup={false}>
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "<signalintegrity> needs a stackup: set fabricatorPreset or define one.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
