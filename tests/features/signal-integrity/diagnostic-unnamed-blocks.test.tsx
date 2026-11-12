import { simulation } from "lib/namespaced-elements"
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
        <simulation.pcbtransientchannelsimulation
          key={name ?? "unnamed"}
          name={name}
          bitRate="20Mbps"
          allowUnroutedTraces
        >
          <simulation.pcbchannel
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
          />
        </simulation.pcbtransientchannelsimulation>
      ))}
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "This board has 3 <simulation.pcbtransientchannelsimulation> blocks; give each a name.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
