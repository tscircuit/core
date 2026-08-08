import { expect, test } from "bun:test"
import type { SolverEndedEvent, SolverStartedEvent } from "lib/events"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("schematic auto layout emits the Matchpack solver event", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: SolverStartedEvent[] = []
  const solverEndedEvents: SolverEndedEvent[] = []
  const solverLifecycleEvents: Array<"started" | "ended"> = []

  circuit.on("solver:started", (event) => {
    solverStartedEvents.push(event)
    if (event.solverName === "LayoutPipelineSolver") {
      solverLifecycleEvents.push("started")
    }
  })
  circuit.on("solver:ended", (event) => {
    solverEndedEvents.push(event)
    if (event.solverName === "LayoutPipelineSolver") {
      solverLifecycleEvents.push("ended")
    }
  })

  circuit.add(
    <board width="15mm" height="15mm" routingDisabled schAutoLayoutEnabled>
      <chip name="U1" footprint="tssop20" />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor name="C1" capacitance="1uF" footprint="0603" />
      <trace from=".R1 .pin1" to=".C1 .pin1" />
      <trace from=".R1 .pin2" to=".U1 .pin20" />
      <trace from=".C1 .pin1" to=".U1 .pin3" />
      <trace from=".C1 .pin2" to=".U1 .pin13" />
      <trace from=".R1 .pin1" to=".U1 .pin11" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const matchpackSolverEvent = solverStartedEvents.find(
    (event) => event.solverName === "LayoutPipelineSolver",
  )

  expect(matchpackSolverEvent).toBeDefined()
  expect(matchpackSolverEvent?.componentName.replace(/#\d+/, "#")).toBe(
    "<board# />",
  )
  expect(matchpackSolverEvent?.solverParams).toMatchObject({
    chipMap: expect.any(Object),
    chipPinMap: expect.any(Object),
    netConnMap: expect.any(Object),
  })
  expect(matchpackSolverEvent?.solverConstructorArgs).toEqual([
    matchpackSolverEvent?.solverParams,
  ])

  const matchpackSolverEndedEvent = solverEndedEvents.find(
    (event) => event.solverName === "LayoutPipelineSolver",
  )

  expect(matchpackSolverEndedEvent).toMatchObject({
    componentName: matchpackSolverEvent?.componentName,
    solved: true,
    failed: false,
    error: null,
  })
  expect(matchpackSolverEndedEvent?.iterations).toBeGreaterThan(0)
  expect(solverLifecycleEvents).toEqual(["started", "ended"])
})
