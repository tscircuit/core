import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: mask-without-strobe", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <signalintegrity bitRate="20Mbps" unrouted="ideal">
        <signal
          name="DATA"
          driver=".TX > .Y"
          receiver=".RX > .A"
          mask={{ setup: "75ps", hold: "100ps" }}
        />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "mask.setup and mask.hold need a strobe.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
