import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number; layer?: string }

const wire = (point: Point, width: number) => ({
  route_type: "wire" as const,
  x: point.x,
  y: point.y,
  width,
  layer: point.layer ?? "top",
})

const createSquigglyAutorouter = async (simpleRouteJson: SimpleRouteJson) => {
  let complete: ((event: any) => void) | undefined

  const solveSync = () =>
    simpleRouteJson.connections.map((connection) => {
      const [start, end] = connection.pointsToConnect as [Point, Point]
      const width = connection.nominalTraceWidth ?? 0.15

      return {
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_squiggle`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: Array.from({ length: 7 }, (_, i) => {
          const t = i / 6
          const offset = i === 0 || i === 6 ? 0 : i % 2 ? -0.8 : 0.8
          return wire(
            {
              x: start.x + (end.x - start.x) * t,
              y: start.y + (end.y - start.y) * t + offset,
              layer: start.layer ?? end.layer,
            },
            width,
          )
        }),
      }
    })

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

test("autoroutingphase can reroute a region with a squiggly route", async () => {
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
        region={{
          shape: "rect",
          minX: 0,
          maxX: 8,
          minY: -5,
          maxY: 5,
        }}
        autorouter={{
          algorithmFn: createSquigglyAutorouter,
        }}
      />

      <trace from="T1.pin1" to="T2.pin1" />
      <trace from="M1.pin1" to="M2.pin1" />
      <trace from="B1.pin1" to="B2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
