import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unmodelled-part", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <chip name="D5" footprint="soic2" pinLabels={{ pin1: "A", pin2: "K" }} />
      <trace from=".TX > .Y" to=".D5 > .A" />
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    '.D5 is on signal "DATA" and has no SPICE or IBIS model.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
