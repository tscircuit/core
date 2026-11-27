import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SignalTerminal } from "./fixtures/matched-bus-phase-split.fixture"

test("route a crossing signal after matching a two-trace bus", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board width={18} height={12} layers={4} schematicDisabled>
      <SignalTerminal name="TX0" pcbX={-5} pcbY={1} />
      <SignalTerminal name="RX0" pcbX={5} pcbY={1} />
      <SignalTerminal name="TX1" pcbX={-5} pcbY={0} />
      <SignalTerminal name="RX1" pcbX={3.5} pcbY={0} />
      <SignalTerminal name="CTL1" pcbX={2} pcbY={-2} />
      <SignalTerminal name="CTL2" pcbX={2} pcbY={2} />
      <trace name="D0" from="TX0.pin1" to="RX0.pin1" routingPhaseIndex={0} />
      <trace name="D1" from="TX1.pin1" to="RX1.pin1" routingPhaseIndex={0} />
      <bus
        name="DATA"
        connections={["D0", "D1"]}
        maxLengthSkew={0.05}
        routingPhaseIndex={0}
      />
      <trace
        name="CTRL"
        from="CTL1.pin1"
        to="CTL2.pin1"
        routingPhaseIndex={1}
      />
      <autoroutingphase
        name="Data bus"
        phaseIndex={0}
        autorouter="auto_local"
      />
      <autoroutingphase
        name="Control signal"
        phaseIndex={1}
        autorouter="auto_local"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "length-matched-bus-phase-handoff",
    circuit,
  )
})
