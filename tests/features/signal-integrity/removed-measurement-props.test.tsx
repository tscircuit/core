import { expect } from "bun:test"
import { simulation } from "lib/namespaced-elements"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("removed measurement props reject TSX channels instead of emitting source records", async () => {
  for (const prop of [
    "mask",
    "strobeRef",
    "strobe",
    "setup",
    "hold",
    "thresholds",
  ]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <DiagnosticBoard>
        <simulation.pcbtransientchannelsimulation
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <simulation.pcbchannel
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            {...{ [prop]: "removed" }}
          />
        </simulation.pcbtransientchannelsimulation>
      </DiagnosticBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow()
    expect(circuit.db.simulation_signal.list()).toHaveLength(0)
  }
})
