import { expect } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { DiagnosticBoard } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("PRBS phases use sorted board-wide names, retain quiet phases and pass explicit seeds unchanged", async () => {
  for (const pattern of ["prbs7", "prbs15", "prbs31"]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <DiagnosticBoard>
        {["C", "A", "B"].map((name) => (
          <signalintegrity
            key={name}
            name={name}
            bitRate="20Mbps"
            unrouted="ideal"
          >
            <signal
              name={name}
              driver=".TX > .Y"
              receiver=".RX > .A"
              pattern={pattern}
              quiet={name === "B" ? "low" : undefined}
            />
          </signalintegrity>
        ))}
        <signalintegrity name="REPEAT" bitRate="20Mbps" unrouted="ideal">
          <signal
            name="B"
            driver=".TX > .Y"
            receiver=".RX > .A"
            pattern={pattern}
          />
        </signalintegrity>
        <signalintegrity name="OVERRIDE" bitRate="20Mbps" unrouted="ideal">
          <signal
            name="A"
            driver=".TX > .Y"
            receiver=".RX > .A"
            pattern={pattern}
            seed={1}
          />
        </signalintegrity>
      </DiagnosticBoard>,
    )
    await circuit.renderUntilSettled()
    const byBlock = Object.fromEntries(
      circuit.db.simulation_signal_integrity.list().map((block) => [
        block.name!,
        circuit.db.simulation_signal.list({
          simulation_signal_integrity_id: block.simulation_signal_integrity_id,
        })[0],
      ]),
    )
    expect(byBlock.A.seed).toBe(2 ** Number(pattern.slice(4)) - 1)
    expect(byBlock.B.seed).toBe(byBlock.REPEAT.seed)
    expect(byBlock.OVERRIDE.seed).toBe(1)
    expect(new Set([byBlock.A.seed, byBlock.B.seed, byBlock.C.seed]).size).toBe(
      3,
    )
    if (pattern === "prbs7")
      expect([byBlock.A.seed, byBlock.B.seed, byBlock.C.seed]).toEqual([
        127, 51, 45,
      ])
    for (const signal of Object.values(byBlock))
      expect(any_circuit_element.safeParse(signal).success).toBe(true)
  }
})
