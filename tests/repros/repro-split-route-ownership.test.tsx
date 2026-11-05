import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function getWireSegments(traces: PcbTrace[]) {
  return traces
    .flatMap((trace) =>
      trace.route.flatMap((start, pointIndex) => {
        const end = trace.route[pointIndex + 1]
        if (
          start.route_type !== "wire" ||
          end?.route_type !== "wire" ||
          start.layer !== end.layer ||
          (start.x === end.x && start.y === end.y)
        )
          return []
        return [
          {
            endpoints: [
              [start.x, start.y],
              [end.x, end.y],
            ].sort(),
            layer: start.layer,
            width: start.width,
          },
        ]
      }),
    )
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

test("split via-to-via route retains source_trace_id ownership and produces 0 false connectivity errors", async () => {
  const renderedCircuits = []
  for (const split of [true, false]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={18} height={12} schLayout={{ layoutMode: "none" }}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={-4}
          layer="bottom"
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0603"
          pcbX={4}
          layer="bottom"
        />
        <trace from="R1.pin1" to="R2.pin1" />
        <autoroutingphase
          name="saved-route"
          algorithmFn={createBasicAutorouter(async (input) => {
            const connection = input.connections[0]!
            const [first, last] = connection.pointsToConnect
            const left = { x: first.x, y: first.y + 1 }
            const right = { x: last.x, y: last.y + 1 }
            const parts: SimplifiedPcbTrace["route"][] = [
              [
                {
                  route_type: "wire",
                  x: first.x,
                  y: first.y,
                  layer: "bottom",
                  width: 0.2,
                },
                { route_type: "wire", ...left, layer: "bottom", width: 0.2 },
                {
                  route_type: "via",
                  ...left,
                  from_layer: "bottom",
                  to_layer: "top",
                  via_diameter: 0.6,
                  via_hole_diameter: 0.3,
                },
                { route_type: "wire", ...left, layer: "top", width: 0.2 },
              ],
              [
                { route_type: "wire", ...left, layer: "top", width: 0.2 },
                { route_type: "wire", ...right, layer: "top", width: 0.2 },
              ],
              [
                { route_type: "wire", ...right, layer: "top", width: 0.2 },
                {
                  route_type: "via",
                  ...right,
                  from_layer: "top",
                  to_layer: "bottom",
                  via_diameter: 0.6,
                  via_hole_diameter: 0.3,
                },
                { route_type: "wire", ...right, layer: "bottom", width: 0.2 },
                {
                  route_type: "wire",
                  x: last.x,
                  y: last.y,
                  layer: "bottom",
                  width: 0.2,
                },
              ],
            ]
            return (split ? parts : [parts.flat()]).map(
              (route, traceIndex) => ({
                type: "pcb_trace",
                pcb_trace_id: `saved_route_${traceIndex}`,
                connection_name: connection.name,
                connectsTo: connection.pointsToConnect.map(
                  (point) => point.pcb_port_id!,
                ),
                route,
              }),
            )
          })}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    renderedCircuits.push(circuit)
  }

  const [splitCircuit, continuousCircuit] = renderedCircuits
  const splitTraces = splitCircuit.db.pcb_trace.list()
  const continuousTraces = continuousCircuit.db.pcb_trace.list()
  expect(splitTraces).toHaveLength(3)
  expect(continuousTraces).toHaveLength(1)
  expect(getWireSegments(splitTraces)).toEqual(
    getWireSegments(continuousTraces),
  )

  const sourceTraceId = splitCircuit.db.source_trace.list()[0].source_trace_id
  expect(splitTraces.map((trace) => trace.source_trace_id)).toEqual([
    sourceTraceId,
    sourceTraceId,
    sourceTraceId,
  ])
  expect(splitCircuit.db.pcb_trace_error.list()).toEqual([])
  expect(continuousCircuit.db.pcb_trace_error.list()).toEqual([])
})
