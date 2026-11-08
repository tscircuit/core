import { expect, test } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import { getSiTestFixture } from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unnamed-blocks", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      {[undefined, "LOW", "HIGH"].map((name) => (
        <signalintegrity
          key={name ?? "unnamed"}
          name={name}
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
        </signalintegrity>
      ))}
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "This board has 3 <signalintegrity> blocks; give each a name.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
