import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("every PRBS order rejects fractional, nonfinite, zero and out-of-range explicit seeds", async () => {
  for (const order of [7, 15, 31]) {
    const limit = 2 ** order - 1
    for (const seed of [-1, 0, 1.5, limit + 1, NaN, Infinity]) {
      const { circuit } = getSiTestFixture()
      circuit.add(
        <DiagnosticBoard>
          <signalintegrity.simulation bitRate="20Mbps" unrouted="ideal">
            <signalintegrity.signal
              name="DATA"
              driverRef=".TX > .Y"
              receiverRef=".RX > .A"
              pattern={`prbs${order}`}
              seed={seed}
              quiet="low"
            />
          </signalintegrity.simulation>
        </DiagnosticBoard>,
      )
      await expect(circuit.renderUntilSettled()).rejects.toThrow(
        `Signal "DATA": prbs${order} seed must be an integer in 1..${limit}.`,
      )
      expect(circuit.db.simulation_signal.list()).toHaveLength(0)
    }
  }
})
