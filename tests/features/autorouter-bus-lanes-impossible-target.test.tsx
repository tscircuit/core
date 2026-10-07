import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

test("bus_lanes reports failure when a target is shorter than its endpoints", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled routeRemaining={false}>
      <LengthTestTerminal name="TX" x={-6} y={0} />
      <LengthTestTerminal name="RX" x={6} y={0} />
      <trace name="D0" from="TX.pin1" to="RX.pin1" />
      <bus
        name="DATA"
        connections={["D0"]}
        routingPhaseIndex={0}
        targetLength="5mm"
        lengthTolerance="0.5mm"
      />
      <autoroutingphase phaseIndex={0} autorouter="bus_lanes" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
})
