import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type XYPoint = { x: number; y: number }

const pointsAreEqual = (a: XYPoint, b: XYPoint) =>
  Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9

const orientation = (a: XYPoint, b: XYPoint, c: XYPoint) =>
  (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)

const segmentIntersects = (a: XYPoint, b: XYPoint, c: XYPoint, d: XYPoint) => {
  if (
    pointsAreEqual(a, c) ||
    pointsAreEqual(a, d) ||
    pointsAreEqual(b, c) ||
    pointsAreEqual(b, d)
  ) {
    return false
  }

  return (
    orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0
  )
}

function expectNoPcbTraceIntersections(
  circuit: ReturnType<typeof getTestFixture>["circuit"],
) {
  const traces = circuit.db.pcb_trace.list()
  for (let traceIndex = 0; traceIndex < traces.length; traceIndex++) {
    const trace = traces[traceIndex]
    const wirePoints = trace.route.filter(
      (point): point is typeof point & XYPoint => "x" in point && "y" in point,
    )
    for (
      let nextTraceIndex = traceIndex + 1;
      nextTraceIndex < traces.length;
      nextTraceIndex++
    ) {
      const nextTrace = traces[nextTraceIndex]
      const nextWirePoints = nextTrace.route.filter(
        (point): point is typeof point & XYPoint =>
          "x" in point && "y" in point,
      )
      for (let i = 0; i < wirePoints.length - 1; i++) {
        for (let j = 0; j < nextWirePoints.length - 1; j++) {
          expect(
            segmentIntersects(
              wirePoints[i],
              wirePoints[i + 1],
              nextWirePoints[j],
              nextWirePoints[j + 1],
            ),
          ).toBe(false)
        }
      }
    }
  }
}

const createStraightAutorouter = () =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
    return simpleRouteJson.connections.map(
      (connection): SimplifiedPcbTrace => ({
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_baseline`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: connection.pointsToConnect.map((point) => ({
          route_type: "wire",
          x: point.x,
          y: point.y,
          width: connection.nominalTraceWidth ?? 0.15,
          layer: point.layer,
        })),
      }),
    )
  })

const createZigzagRerouteAutorouter = (
  reroutedConnectionNames: string[],
  rerouteConnectionCounts: number[],
) =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
    rerouteConnectionCounts.push(simpleRouteJson.connections.length)
    reroutedConnectionNames.push(
      ...simpleRouteJson.connections.map((connection) => connection.name),
    )

    return simpleRouteJson.connections.map(
      (connection, connectionIndex): SimplifiedPcbTrace => {
        const [start, end] = connection.pointsToConnect as Array<{
          x: number
          y: number
          layer: string
        }>
        const zigzagOffset = 0.75 + connectionIndex * 0.35
        const horizontal =
          Math.abs(start.x - end.x) >= Math.abs(start.y - end.y)

        return {
          type: "pcb_trace",
          pcb_trace_id: `${connection.name}_zigzag`,
          connection_name: connection.source_trace_id ?? connection.name,
          route: horizontal
            ? [
                {
                  route_type: "wire",
                  x: start.x,
                  y: start.y,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: start.x + 1.2,
                  y: start.y + zigzagOffset,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: (start.x + end.x) / 2,
                  y: start.y - zigzagOffset,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: end.x - 1.2,
                  y: end.y + zigzagOffset,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: end.layer,
                },
                {
                  route_type: "wire",
                  x: end.x,
                  y: end.y,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: end.layer,
                },
              ]
            : [
                {
                  route_type: "wire",
                  x: start.x,
                  y: start.y,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: start.x + zigzagOffset,
                  y: start.y + 1.2,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: start.x - zigzagOffset,
                  y: (start.y + end.y) / 2,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: start.layer,
                },
                {
                  route_type: "wire",
                  x: end.x + zigzagOffset,
                  y: end.y - 1.2,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: end.layer,
                },
                {
                  route_type: "wire",
                  x: end.x,
                  y: end.y,
                  width: connection.nominalTraceWidth ?? 0.15,
                  layer: end.layer,
                },
              ],
        }
      },
    )
  })

test("autoroutingphase reroute supports connection props", async () => {
  const renderRerouteCircuit = async (
    snapshotName: string,
    reroutePhase:
      | { connection: string; connections?: undefined }
      | { connection?: undefined; connections: string[] },
    expectedReroutedConnectionCount: number,
  ) => {
    const { circuit } = getTestFixture()
    const reroutedConnectionNames: string[] = []
    const rerouteConnectionCounts: number[] = []

    circuit.add(
      <board width="20mm" height="18mm">
        <resistor
          name="H1"
          resistance="1k"
          footprint="0402"
          pcbX={-9}
          pcbY={-5}
        />
        <resistor
          name="H2"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={-5}
        />
        <resistor
          name="H3"
          resistance="1k"
          footprint="0402"
          pcbX={-9}
          pcbY={-2}
        />
        <resistor
          name="H4"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={-2}
        />
        <resistor
          name="V1"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={-7}
        />
        <resistor
          name="V2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={7}
        />
        <autoroutingphase
          phaseIndex={0}
          autorouter={{
            local: true,
            groupMode: "subcircuit",
            algorithmFn: createStraightAutorouter(),
          }}
        />
        <autoroutingphase
          phaseIndex={1}
          reroute
          {...reroutePhase}
          autorouter={{
            local: true,
            groupMode: "subcircuit",
            algorithmFn: createZigzagRerouteAutorouter(
              reroutedConnectionNames,
              rerouteConnectionCounts,
            ),
          }}
        />
        <trace from=".H1 > .pin1" to=".H2 > .pin1" routingPhaseIndex={0} />
        <trace from=".H3 > .pin1" to=".H4 > .pin1" routingPhaseIndex={0} />
        <trace from=".V1 > .pin1" to=".V2 > .pin1" routingPhaseIndex={0} />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(rerouteConnectionCounts).toEqual([expectedReroutedConnectionCount])
    expect(reroutedConnectionNames).toHaveLength(
      expectedReroutedConnectionCount,
    )
    expect(
      circuit.db.pcb_trace
        .list()
        .filter((trace) => trace.pcb_trace_id.includes("_zigzag")),
    ).toHaveLength(expectedReroutedConnectionCount)
    expectNoPcbTraceIntersections(circuit)
    expect(circuit).toMatchPcbSnapshot(snapshotName)
  }

  await renderRerouteCircuit(
    `${import.meta.path}-single-connection`,
    { connection: "H1.pin1" },
    1,
  )
  await renderRerouteCircuit(
    `${import.meta.path}-connections-array`,
    { connections: ["H1.pin1", "V1.pin1"] },
    2,
  )
})
