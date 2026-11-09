import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"

test("cached SI records enforce destination board block naming", async () => {
  const { circuit: original } = getSiTestFixture()
  original.add(
    <DiagnosticBoard>
      <signalintegrity.simulation bitRate="20Mbps" unrouted="ideal">
        <signalintegrity.signal
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
        />
      </signalintegrity.simulation>
    </DiagnosticBoard>,
  )
  await original.renderUntilSettled()
  for (const stackup of [false, true]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <board
        routingDisabled
        fabricatorPreset={stackup ? "jlcpcb_standard" : undefined}
      >
        <subcircuit
          name="A"
          pcbX={-15}
          circuitJson={original.getCircuitJson()}
        />
        <subcircuit
          name="B"
          pcbX={15}
          circuitJson={original.getCircuitJson()}
        />
      </board>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      "This board has 2 <signalintegrity.simulation> blocks; give each a name.",
    )
  }
})
