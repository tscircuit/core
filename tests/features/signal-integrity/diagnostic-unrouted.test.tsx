import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: unrouted", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <simulation.pcbtransientchannelsimulation bitRate="20Mbps">
        <simulation.pcbchannel
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DATA" is not routed between .TX > .Y and .RX > .A.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
