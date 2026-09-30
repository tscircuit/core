import { expect, test } from "bun:test"
import type {
  AutoroutingProgressEvent,
  SolverEndedEvent,
  SolverStartedEvent,
} from "lib/events"
import { DogboneAutorouter } from "lib/utils/autorouting/DogboneAutorouter"
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
  let eventLoopYielded = false
  circuit.on("autorouting:start", (event) => {
    if (event.solverName === "DogboneFanoutSolver")
      lifecycle.push("routing_started")
  })
  circuit.on("solver:started", (event) => {
    if (event.solverName !== "DogboneFanoutSolver") return
    setTimeout(() => {
      eventLoopYielded = true
    }, 0)
    started.push(event)
    lifecycle.push("started")
  })
  circuit.on("solver:ended", (event) => {
    if (event.solverName !== "DogboneFanoutSolver") return
    ended.push(event)
    lifecycle.push("ended")
  })
  circuit.on("autorouting:progress", (event) => {
    if (event.solverName !== "DogboneFanoutSolver") return
    expect(eventLoopYielded).toBe(true)
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
  expect(lifecycle.slice(0, 2)).toEqual(["routing_started", "started"])
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
      emitted.route.flatMap((point) =>
        point.route_type === "wire" || point.route_type === "via"
          ? [{ x: point.x, y: point.y, route_type: point.route_type }]
          : [],
      ),
    ).toEqual(
      trace.route.flatMap((point) =>
        point.route_type === "wire" || point.route_type === "via"
          ? [{ x: point.x, y: point.y, route_type: point.route_type }]
          : [],
      ),
    )
  }
  const cancelled = new DogboneAutorouter(args[0])
  const cancelledEvents: string[] = []
  cancelled.on("complete", () => cancelledEvents.push("complete"))
  cancelled.on("progress", () => cancelledEvents.push("progress"))
  cancelled.on("error", () => cancelledEvents.push("error"))
  cancelled.start()
  cancelled.stop()
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(cancelledEvents).toEqual([])
  expect(cancelled.isRouting).toBe(false)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
