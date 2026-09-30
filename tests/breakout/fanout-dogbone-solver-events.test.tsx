import { expect, test } from "bun:test"
import type {
  AutoroutingProgressEvent,
  SolverEndedEvent,
  SolverStartedEvent,
} from "lib/events"
import { SOLVERS } from "lib/solvers"
import type { DogboneFanoutSolverInput } from "lib/utils/autorouting/DogboneFanoutSolver"
import { AM3352 } from "tests/fixtures/am3352-dogbone"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone solver events can replay and step the AM3352 solve", async () => {
  const { circuit } = getTestFixture()
  const started: SolverStartedEvent[] = []
  const ended: SolverEndedEvent[] = []
  const progress: AutoroutingProgressEvent[] = []
  const lifecycle: string[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName !== "DogboneFanoutSolver") return
    started.push(event)
    lifecycle.push("started")
  })
  circuit.on("solver:ended", (event) => {
    if (event.solverName !== "DogboneFanoutSolver") return
    ended.push(event)
    lifecycle.push("ended")
  })
  circuit.on("autorouting:progress", (event) => {
    if (
      event.solverName !== "DogboneFanoutSolver" ||
      !event.phaseName?.startsWith("dogbone:")
    )
      return
    progress.push(event)
    lifecycle.push("progress")
  })
  circuit.add(
    <board
      width={20}
      height={21}
      layers={4}
      routeRemaining={false}
      minTraceWidth={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
    >
      <fanout autorouter="dogbone">
        <AM3352 />
      </fanout>
      <pcbnotetext
        pcbY={9}
        text="Replayable DogboneFanoutSolver: 324 escapes"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(started).toHaveLength(1)
  expect(ended).toHaveLength(1)
  expect(lifecycle[0]).toBe("started")
  expect(lifecycle.at(-1)).toBe("ended")
  expect(ended[0]).toMatchObject({ solved: true, failed: false, error: null })
  expect(progress.length).toBeGreaterThan(2)
  expect(progress.at(-1)?.progress).toBe(1)
  expect(progress.at(-1)?.debugGraphics.lines).toHaveLength(324)

  const args: [DogboneFanoutSolverInput] = JSON.parse(
    JSON.stringify(started[0]!.solverConstructorArgs),
  )
  const replay = new SOLVERS.DogboneFanoutSolver(...args)
  expect(replay.visualize().rects!.length).toBeGreaterThanOrEqual(324)
  replay.step()
  expect(replay.solved).toBe(false)
  expect(replay.phase).toBe("assigning_sites")
  replay.solve()
  expect(replay.failed).toBe(false)
  expect(replay.iterations).toBe(ended[0]!.iterations)
  expect(replay.getOutput()).toHaveLength(324)
  for (const trace of replay.getOutput()) {
    const emitted = circuit.db.pcb_trace
      .list()
      .find((candidate) => candidate.pcb_trace_id === trace.pcb_trace_id)!
    expect(emitted).toBeDefined()
    expect(
      emitted.route.map((point) =>
        point.route_type === "through_pad"
          ? point
          : { x: point.x, y: point.y, route_type: point.route_type },
      ),
    ).toEqual(
      trace.route.map((point) =>
        point.route_type === "through_pad"
          ? point
          : { x: point.x, y: point.y, route_type: point.route_type },
      ),
    )
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
