import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-driver-model", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard missingModel="TX">
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="D0"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "D0" driver .TX > .Y has no <simulation.ibismodel>.',
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
