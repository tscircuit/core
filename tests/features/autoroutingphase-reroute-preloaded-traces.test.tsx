import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number; layer?: string }

const createPipeline9LikeAutorouter = async (
  simpleRouteJson: SimpleRouteJson,
) => {
  let complete: ((event: any) => void) | undefined

  const solveSync = (): SimplifiedPcbTrace[] => [
    ...(simpleRouteJson.traces ?? []),
    ...simpleRouteJson.connections.map((connection) => {
      const [start, end] = connection.pointsToConnect as [Point, Point]
      const width = connection.nominalTraceWidth ?? 0.15

      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_rerouted`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: [
          {
            route_type: "wire" as const,
            x: start.x,
            y: start.y,
            width,
            layer: start.layer ?? "top",
          },
          {
            route_type: "wire" as const,
            x: end.x,
            y: end.y,
            width,
            layer: end.layer ?? "top",
          },
        ],
      }
    }),
  ]

  return {
    isRouting: false,
    on: (event: string, callback: any) => {
      if (event === "complete") complete = callback
    },
    start: () => complete?.({ type: "complete", traces: solveSync() }),
    stop: () => {},
    solveSync,
  } as any
}

test("region reroute does not duplicate preloaded Pipeline9-like traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <testpoint name="T1" pcbX={-7} pcbY={3} padDiameter="0.8mm" />
      <testpoint name="T2" pcbX={7} pcbY={3} padDiameter="0.8mm" />
      <testpoint name="M1" pcbX={-7} pcbY={0} padDiameter="0.8mm" />
      <testpoint name="M2" pcbX={7} pcbY={0} padDiameter="0.8mm" />
      <testpoint name="B1" pcbX={-7} pcbY={-3} padDiameter="0.8mm" />
      <testpoint name="B2" pcbX={7} pcbY={-3} padDiameter="0.8mm" />

      <autoroutingphase
        reroute
        region={{ shape: "rect", minX: 0, maxX: 8, minY: -5, maxY: 5 }}
        autorouter={{ algorithmFn: createPipeline9LikeAutorouter }}
      />

      <trace from="T1.pin1" to="T2.pin1" />
      <trace from="M1.pin1" to="M2.pin1" />
      <trace from="B1.pin1" to="B2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const pcbTraces = circuit.db.pcb_trace.list()
  const logicalRouteSignatures = pcbTraces.map((trace) =>
    JSON.stringify({
      source_trace_id: trace.source_trace_id,
      route: trace.route,
    }),
  )

  expect(pcbTraces).toHaveLength(6)
  expect(new Set(logicalRouteSignatures).size).toBe(pcbTraces.length)
})
