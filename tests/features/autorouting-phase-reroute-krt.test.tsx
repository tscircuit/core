import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

type Point = { x: number; y: number; layer?: string }

const wire = (point: Point, width: number) => ({
  route_type: "wire" as const,
  x: point.x,
  y: point.y,
  width,
  layer: point.layer ?? "top",
})

const subcircuitCircuitJson = await renderToCircuitJson(
  <board>
    <resistor resistance="1k" footprint="0402" name="R1" pcbX={-5} pcbY={0} />
    <capacitor
      capacitance="1000pF"
      footprint="0402"
      name="C1"
      pcbX={5}
      pcbY={0}
    />
    <trace from="R1.pin1" to="C1.pin1" />
  </board>,
)

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

test("autoroutingphase can reroute a subcircuit with a squiggly route", async () => {
  let capturedSimpleRouteJson: SimpleRouteJson | undefined

  const { circuit } = getTestFixture({
    platform: {
      autorouterMap: {
        krt: {
          createAutorouter: (simpleRouteJson) => {
            capturedSimpleRouteJson = simpleRouteJson
            return createSquigglyAutorouter(simpleRouteJson) as any
          },
        },
      },
    },
  })

  circuit.add(
    <board width="18mm" height="12mm">
      <subcircuit circuitJson={subcircuitCircuitJson} />

      <autoroutingphase
        reroute
        region={{
          shape: "rect",
          minX: -1,
          maxX: 1,
          minY: -1,
          maxY: 1,
        }}
        autorouter={"krt"}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
