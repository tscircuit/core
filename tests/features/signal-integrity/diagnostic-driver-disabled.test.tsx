import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("driverDisabled requires a disabled IBIS driver state", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      <simulation.pcbtransientchannelsimulation
        bitRate="20Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbchannel
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
          driverDisabled
        />
      </simulation.pcbtransientchannelsimulation>
    </DiagnosticBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Signal "DATA": .TX > .Y model LVC1G04_OUT_33 has no disabled state.',
  )
})
