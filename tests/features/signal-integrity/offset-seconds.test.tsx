import { expect } from "bun:test"
import { simulation } from "lib/namespaced-elements"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("numeric offsets are seconds and UI offsets use the channel rate", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      {(
        [
          ["SECONDS", 0.5],
          ["UI", "0.5UI"],
          ["TIME", "50ns"],
        ] as const
      ).map(([name, offset]) => (
        <simulation.pcbtransientchannelsimulation
          key={name}
          name={name}
          bitRate="20Mbps"
          duration="1ns"
          unrouted="ideal"
        >
          <simulation.pcbchannel
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            bitRate="10Mbps"
            offset={offset}
          />
        </simulation.pcbtransientchannelsimulation>
      ))}
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  for (const block of circuit.db.simulation_signal_integrity.list()) {
    const [channel] = circuit.db.simulation_signal.list({
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
    })
    expect(channel.offset_s).toBeCloseTo(
      block.name === "SECONDS" ? 0.5 : 50e-9,
      15,
    )
    expect(block.duration_s).toBe(1e-9)
  }
})
