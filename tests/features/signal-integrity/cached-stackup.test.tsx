import { expect } from "bun:test"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("cached SI declarations require the destination board stackup", async () => {
  const { circuit: original } = getSiTestFixture()
  original.add(
    <DiagnosticBoard>
      <signalintegrity name="WRITE" bitRate="20Mbps" unrouted="ideal">
        <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
      </signalintegrity>
    </DiagnosticBoard>,
  )
  await original.renderUntilSettled()
  const { circuit } = getSiTestFixture()
  circuit.add(
    <board routingDisabled>
      <subcircuit name="CACHED" circuitJson={original.getCircuitJson()} />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "<signalintegrity> needs a stackup: set fabricatorPreset or define one.",
  )
  expect(circuit.db.simulation_signal.list()).toHaveLength(0)
})
