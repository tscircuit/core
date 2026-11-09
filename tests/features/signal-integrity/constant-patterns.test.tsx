import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("constant bit strings normalize to quiet while explicit quiet takes precedence", async () => {
  const { circuit } = getSiTestFixture()
  circuit.add(
    <DiagnosticBoard>
      {["0", "1", "000", "111", "clock", "00110"].map((pattern) => (
        <signalintegrity.simulation
          key={pattern}
          name={pattern}
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <signalintegrity.signal
            name="DATA"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            pattern={pattern}
            seed={42}
          />
        </signalintegrity.simulation>
      ))}
      <signalintegrity.simulation
        name="EXPLICIT"
        bitRate="20Mbps"
        unrouted="ideal"
      >
        <signalintegrity.signal
          name="DATA"
          driverRef=".TX > .Y"
          receiverRef=".RX > .A"
          pattern="111"
          quiet="low"
        />
      </signalintegrity.simulation>
    </DiagnosticBoard>,
  )
  await circuit.renderUntilSettled()
  for (const block of circuit.db.simulation_signal_integrity.list()) {
    const signal = circuit.db.simulation_signal.list({
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
    })[0]
    const quiet =
      block.name === "EXPLICIT" || /^0+$/.test(block.name!)
        ? "low"
        : /^1+$/.test(block.name!)
          ? "high"
          : undefined
    expect(signal.quiet).toBe(quiet)
    expect(signal).not.toHaveProperty("seed")
    expect(block).not.toHaveProperty("duration_s")
    expect(block).not.toHaveProperty("supply")
    expect(any_circuit_element.safeParse(signal).success).toBe(true)
  }
})
