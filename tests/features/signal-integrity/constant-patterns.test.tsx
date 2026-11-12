import { simulation } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("constant bit strings remain literals without legacy signal fields", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      {["0", "1", "000", "111", "clock", "00110"].map((pattern) => (
        <simulation.pcbtransientchannelsimulation
          key={pattern}
          name={pattern}
          bitRate="20Mbps"
          allowUnroutedTraces
        >
          <simulation.pcbchannel
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            pattern={pattern}
            seed={42}
          />
        </simulation.pcbtransientchannelsimulation>
      ))}
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  for (const block of circuit.db.simulation_signal_integrity.list()) {
    const signal = circuit.db.simulation_signal.list({
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
    })[0]
    expect(signal.pattern).toBe(block.name!)
    expect(signal).not.toHaveProperty("quiet")
    expect(signal).not.toHaveProperty("probe")
    expect(signal).not.toHaveProperty("driver_disabled")
    expect(signal).not.toHaveProperty("seed")
    expect(block).not.toHaveProperty("duration_s")
    expect(block).not.toHaveProperty("supply")
    expect(any_circuit_element.safeParse(signal).success).toBe(true)
  }
})
