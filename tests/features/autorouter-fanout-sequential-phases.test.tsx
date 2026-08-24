import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sequential board fanout phases are not treated as overlapping breakout regions", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: SolverStartedEvent[] = []
  circuit.on("solver:started", (event: SolverStartedEvent) => {
    solverStartedEvents.push(event)
  })

  circuit.add(
    <board width="20mm" height="10mm" autorouter="default">
      <autoroutingphase
        name="FIRST_FANOUT"
        phaseIndex={0}
        autorouter="fanout"
      />
      <autoroutingphase
        name="SECOND_FANOUT"
        phaseIndex={1}
        autorouter="fanout"
      />

      <chip name="U1" footprint="soic8" />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={1} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={4} pcbY={-1} />

      <trace
        name="FIRST_SIGNAL"
        from="U1.pin1"
        to="R2.pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="SECOND_SIGNAL"
        from="U1.pin2"
        to="R3.pin1"
        routingPhaseIndex={1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(
    solverStartedEvents.filter((event) => event.solverName === "FanoutSolver"),
  ).toHaveLength(2)
})
