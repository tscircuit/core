import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Compare physical segments in board-world mm (+X right, +Y up),
 * independent of trace direction and endpoint metadata. */
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

test("split via-to-via route retains ownership with identical connected copper", async () => {
  // A deterministic router response isolates Core's import, not solver quality.
  const renderedCircuits = []
  for (const { split, namedNet } of [
    { split: true, namedNet: false },
    { split: false, namedNet: false },
    { split: true, namedNet: true },
  ]) {
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
        {namedNet ? (
          <>
            <net name="GND" />
            <trace from="R1.pin1" to="net.GND" />
            <trace from="R2.pin1" to="net.GND" />
          </>
        ) : (
          <trace from="R1.pin1" to="R2.pin1" />
        )}
        <autoroutingphase
          name="saved-route"
          algorithmFn={createBasicAutorouter(async (input) => {
            const connection = input.connections[0]!
            const [first, last] = connection.pointsToConnect
            const left = { x: first.x, y: first.y + 1 }
            const right = { x: last.x, y: last.y + 1 }
            // Board-world points in mm, +X right / +Y up, two outer copper layers.
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
            // Import the named-net bridge first so ownership cannot depend on
            // previously inserted pieces.
            const routes = namedNet
              ? [parts[1], parts[0], parts[2]]
              : split
                ? parts
                : [parts.flat()]
            return routes.map((route, traceIndex) => ({
              type: "pcb_trace",
              pcb_trace_id: `saved_route_${traceIndex}`,
              connection_name: connection.name,
              connectsTo: connection.pointsToConnect.map(
                (point) => point.pcb_port_id!,
              ),
              route,
            }))
          })}
        />
        <pcbnotetext
          pcbY={4.7}
          fontSize={0.65}
          text={
            namedNet
              ? "GND: bridge imported first"
              : split
                ? "SPLIT ROUTE: 3 pieces"
                : "CONTROL: 1 continuous piece"
          }
        />
        <pcbnotetext
          pcbY={3.4}
          fontSize={0.45}
          text="Same pads, copper widths and two through vias"
        />
        <pcbnotetext
          pcbY={2.2}
          fontSize={0.45}
          text="Top bridge: connection identity retained"
        />
        <pcbnotetext
          pcbY={-2}
          fontSize={0.45}
          text="Bottom-layer pads and short escapes"
        />
        <pcbnotetext
          pcbY={-3.4}
          fontSize={0.5}
          text="Actual: 0 errors; ownership retained"
        />
        <pcbnotetext
          pcbY={-4.7}
          fontSize={0.45}
          text="Expected: connected copper, 0 errors in both cases"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    renderedCircuits.push(circuit)
  }

  const [splitCircuit, continuousCircuit, netCircuit] = renderedCircuits
  const splitTraces = splitCircuit.db.pcb_trace.list()
  const continuousTraces = continuousCircuit.db.pcb_trace.list()
  expect(splitTraces).toHaveLength(3)
  expect(continuousTraces).toHaveLength(1)
  expect(getWireSegments(splitTraces)).toEqual(
    getWireSegments(continuousTraces),
  )
  expect(splitCircuit.db.pcb_via.list()).toHaveLength(2)
  expect(
    splitCircuit.db.pcb_via
      .list()
      .map(({ x, y, layers, outer_diameter, hole_diameter }) => ({
        x,
        y,
        layers,
        outer_diameter,
        hole_diameter,
      })),
  ).toEqual(
    continuousCircuit.db.pcb_via
      .list()
      .map(({ x, y, layers, outer_diameter, hole_diameter }) => ({
        x,
        y,
        layers,
        outer_diameter,
        hole_diameter,
      })),
  )
  const sourceTraceId = splitCircuit.db.source_trace.list()[0].source_trace_id
  expect(splitTraces.map((trace) => trace.source_trace_id)).toEqual([
    sourceTraceId,
    sourceTraceId,
    sourceTraceId,
  ])
  expect(splitCircuit.db.pcb_trace_error.list()).toEqual([])
  expect(continuousCircuit.db.pcb_trace_error.list()).toEqual([])
  expect(continuousTraces[0].source_trace_id).toBe(
    continuousCircuit.db.source_trace.list()[0].source_trace_id,
  )
  const netTraces = netCircuit.db.pcb_trace.list()
  expect(netTraces[0].source_trace_id).toBe(
    netCircuit.db.source_net.list()[0].source_net_id,
  )
  expect(netCircuit.db.pcb_trace_error.list()).toEqual([])
  expect(getWireSegments(netTraces)).toEqual(getWireSegments(splitTraces))
  const snapshotOptions = {
    showSolderMask: false,
    showSolderPaste: false,
    showDebugObjects: false,
  }
  const snapshotPath = import.meta.path.replace(".test.tsx", "")
  await expect(splitCircuit).toMatchPcbSnapshot(
    `${snapshotPath}-split`,
    snapshotOptions,
  )
  await expect(continuousCircuit).toMatchPcbSnapshot(
    `${snapshotPath}-continuous`,
    snapshotOptions,
  )
  await expect(netCircuit).toMatchPcbSnapshot(
    `${snapshotPath}-net`,
    snapshotOptions,
  )
})
