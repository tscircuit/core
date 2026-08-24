import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("overlapping fanout regions fail before either solver starts", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: SolverStartedEvent[] = []
  circuit.on("solver:started", (event: SolverStartedEvent) => {
    solverStartedEvents.push(event)
  })
  const footprint = (
    <footprint>
      <smtpad portHints={["pin1"]} shape="circle" radius="0.15mm" />
    </footprint>
  )

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={2}
      minTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaPadDiameter="0.3mm"
    >
      <breakout
        name="LEFT_FANOUT"
        pcbX={-1}
        padding="2mm"
        autorouter="fanout"
        busFanoutDirections={{ DATA: "center_right" }}
      >
        <chip name="U1" footprint={footprint} />
      </breakout>
      <breakout
        name="RIGHT_FANOUT"
        pcbX={1}
        padding="2mm"
        autorouter="fanout"
        busFanoutDirections={{ DATA: "center_left" }}
      >
        <chip name="U2" footprint={footprint} />
      </breakout>
      <trace name="DATA0" from="U1.pin1" to="U2.pin1" />
      <bus name="DATA" connections={["DATA0"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    solverStartedEvents.filter(
      (event) =>
        event.solverName === "FanoutSolver" ||
        event.solverName.startsWith("AutoroutingPipeline"),
    ),
  ).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([
    expect.objectContaining({
      message: expect.stringContaining(
        'Fanout regions "LEFT_FANOUT" and "RIGHT_FANOUT" overlap',
      ),
    }),
  ])
})
