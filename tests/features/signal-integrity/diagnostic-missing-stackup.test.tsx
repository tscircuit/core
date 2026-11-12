import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("SI diagnostic: missing-stackup", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard stackup={false}>
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "<simulation.pcbtransientchannelsimulation> needs a stackup: set fabricatorPreset or define one.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
