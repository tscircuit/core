import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: shared-net", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="D0" driver=".TX > .Y" receiver=".RX > .A" />
        <signal name="D1" driver=".RX > .A" receiver=".TX > .Y" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signals "D0" and "D1" are on the same net; one signal per net.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
