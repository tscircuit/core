import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: shared-net", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        unrouted="ideal"
      >
        <simulation.pcbchannel
          name="D0"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
        <simulation.pcbchannel
          name="D1"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signals "D0" and "D1" are on the same net; one signal per net.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
