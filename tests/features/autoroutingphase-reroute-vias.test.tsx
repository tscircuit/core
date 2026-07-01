import { expect, test } from "bun:test"
import type { PcbVia } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number; layer?: string }

const createLayerChangingAutorouter = async (
  simpleRouteJson: SimpleRouteJson,
) => {
  let complete: ((event: any) => void) | undefined

  const solveSync = () => {
    const connection = simpleRouteJson.connections[0]
    const [start, end] = connection.pointsToConnect as [Point, Point]
    const width = connection.nominalTraceWidth ?? 0.15

    return [
      {
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_rerouted_with_explicit_via`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: [
          {
            route_type: "wire" as const,
            x: start.x,
            y: start.y,
            width,
            layer: "top",
          },
          {
            route_type: "wire" as const,
            x: 0,
            y: 0,
            width,
            layer: "bottom",
          },
          {
            route_type: "wire" as const,
            x: end.x,
            y: end.y,
            width,
            layer: "bottom",
          },
        ],
      },
      {
        type: "pcb_via" as const,
        pcb_via_id: `${connection.name}_rerouted_explicit_via`,
        pcb_trace_id: `${connection.name}_rerouted_with_explicit_via`,
        x: 0,
        y: 0,
        outer_diameter: 0.6,
        hole_diameter: 0.3,
        layers: ["top", "bottom"],
        from_layer: "top",
        to_layer: "bottom",
      } satisfies PcbVia,
    ]
  }

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

test("autoroutingphase reroute preserves explicit vias returned by autorouter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="A" pcbX={-3} pcbY={0} padDiameter="0.8mm" />
      <testpoint name="B" pcbX={3} pcbY={0} padDiameter="0.8mm" />

      <autoroutingphase
        reroute
        region={{
          shape: "rect",
          minX: -4,
          maxX: 4,
          minY: -4,
          maxY: 4,
        }}
        autorouter={{ algorithmFn: createLayerChangingAutorouter }}
      />

      <trace from="A.pin1" to="B.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(1)
  expect(vias[0]).toMatchObject({
    x: 0,
    y: 0,
    outer_diameter: 0.6,
    hole_diameter: 0.3,
    layers: ["top", "bottom"],
  })
})
