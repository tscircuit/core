import { simulation } from "lib/namespaced-elements"
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
          <simulation.pcbtransientchannelsimulation
            key={name}
            name={name}
            bitRate="20Mbps"
            unrouted="ideal"
          >
            <simulation.pcbchannel
              name={name}
              driverRef=".TX > .Y"
              receiverRef=".RX > .A"
              pattern={pattern}
              quiet={name === "B" ? "low" : undefined}
            />
          </simulation.pcbtransientchannelsimulation>
        ))}
        <simulation.pcbtransientchannelsimulation
          name="REPEAT"
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <simulation.pcbchannel
            name="B"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            pattern={pattern}
          />
        </simulation.pcbtransientchannelsimulation>
        <simulation.pcbtransientchannelsimulation
          name="OVERRIDE"
          bitRate="20Mbps"
          unrouted="ideal"
        >
          <simulation.pcbchannel
            name="A"
            driverRef=".TX > .Y"
            receiverRef=".RX > .A"
            pattern={pattern}
            seed={1}
          />
        </simulation.pcbtransientchannelsimulation>
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
