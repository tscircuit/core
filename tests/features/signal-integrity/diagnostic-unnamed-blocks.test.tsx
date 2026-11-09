import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unnamed-blocks", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      {[undefined, "LOW", "HIGH"].map((name) => (
        <signalintegrity.simulation
          key={name ?? "unnamed"}
          name={name}
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <signalintegrity.signal
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
          />
        </signalintegrity.simulation>
      ))}
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "This board has 3 <signalintegrity.simulation> blocks; give each a name.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
