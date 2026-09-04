import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createZigzagAutorouter = () =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) =>
    simpleRouteJson.connections.map((connection): SimplifiedPcbTrace => {
      const [start, end] = connection.pointsToConnect
      const routePointCount = 7

      return {
        type: "pcb_trace",
        pcb_trace_id: connection.source_trace_id ?? connection.name,
        connection_name: connection.source_trace_id ?? connection.name,
        route: Array.from({ length: routePointCount }, (_, routePointIndex) => {
          const progress = routePointIndex / (routePointCount - 1)
          const isEndpoint =
            routePointIndex === 0 || routePointIndex === routePointCount - 1
          const yOffset = isEndpoint
            ? 0
            : routePointIndex % 2 === 0
              ? 1.6
              : -1.6

          return {
            route_type: "wire",
            x: start.x + (end.x - start.x) * progress,
            y: start.y + (end.y - start.y) * progress + yOffset,
            width: connection.nominalTraceWidth ?? 0.4,
            layer: start.layer ?? "top",
          }
        }),
      }
    }),
  )

test("simplify autorouting phase cleans existing traces with Pipeline 11", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const solverStartedEvents: SolverStartedEvent[] = []
  circuit.on("solver:started", (event: SolverStartedEvent) => {
    solverStartedEvents.push(event)
  })

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      autorouter={{ algorithmFn: createZigzagAutorouter() }}
    >
      <testpoint name="LEFT" pcbX={-8} pcbY={0} padDiameter="1mm" />
      <testpoint name="RIGHT" pcbX={8} pcbY={0} padDiameter="1mm" />
      <pcbnotetext
        text="PIPELINE 11 SIMPLIFIES THE ZIGZAG ROUTE"
        pcbY={4.5}
        fontSize={0.65}
      />
      <autoroutingphase reroute autorouter="simplify" />
      <trace from="LEFT.pin1" to="RIGHT.pin1" width="0.4mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingPhaseIoStack).toHaveLength(2)
  const zigzagTrace = autoroutingPhaseIoStack[0].endSimpleRouteJson?.traces?.[0]
  const simplifiedTrace =
    autoroutingPhaseIoStack[1].endSimpleRouteJson?.traces?.[0]
  expect(zigzagTrace?.route).toHaveLength(7)
  expect(simplifiedTrace?.route.length).toBeLessThan(7)
  const zigzagWireWidths = new Set(
    zigzagTrace?.route.flatMap((routePoint) =>
      routePoint.route_type === "wire" ? [routePoint.width] : [],
    ),
  )
  const simplifiedWireWidths = new Set(
    simplifiedTrace?.route.flatMap((routePoint) =>
      routePoint.route_type === "wire" ? [routePoint.width] : [],
    ),
  )
  expect(simplifiedWireWidths).toEqual(zigzagWireWidths)
  expect(
    solverStartedEvents.some(
      (event) =>
        event.solverName === "AutoroutingPipelineSolver11_Simplification",
    ),
  ).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
