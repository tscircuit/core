import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routeConnectionsDirectly = async (
  simpleRouteJson: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> =>
  simpleRouteJson.connections.map((connection, connectionIndex) => ({
    type: "pcb_trace",
    pcb_trace_id: `phase_${connectionIndex}_trace`,
    connection_name: connection.source_trace_id ?? connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: connection.nominalTraceWidth ?? 0.15,
      layer: point.layer,
    })),
  }))

const adaptPreloadedTraceAndRouteConnections = async (
  simpleRouteJson: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> => {
  const preloadedTrace = simpleRouteJson.traces?.[0]
  if (!preloadedTrace) throw new Error("Expected a preloaded trace")

  const firstPoint = preloadedTrace.route[0]
  const lastPoint = preloadedTrace.route.at(-1)
  if (firstPoint?.route_type !== "wire" || lastPoint?.route_type !== "wire") {
    throw new Error("Expected wire endpoints on the preloaded trace")
  }

  const adaptedPreloadedTrace: SimplifiedPcbTrace = {
    ...preloadedTrace,
    route: [
      firstPoint,
      {
        ...firstPoint,
        x: (firstPoint.x + lastPoint.x) / 2,
        y: firstPoint.y + 1.5,
      },
      lastPoint,
    ],
  }

  return [
    adaptedPreloadedTrace,
    ...simpleRouteJson.connections.map((connection) => ({
      type: "pcb_trace" as const,
      pcb_trace_id: "phase_1_trace",
      connection_name: connection.source_trace_id ?? connection.name,
      route: connection.pointsToConnect.map((point) => ({
        route_type: "wire" as const,
        x: point.x,
        y: point.y,
        width: connection.nominalTraceWidth ?? 0.15,
        layer: point.layer,
      })),
    })),
  ]
}

test("later autorouting phase output adapts a preloaded trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm">
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          algorithmFn: createBasicAutorouter(routeConnectionsDirectly),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        autorouter={{
          algorithmFn: createBasicAutorouter(
            adaptPreloadedTraceAndRouteConnections,
          ),
        }}
      />

      <resistor name="A1" resistance="1k" footprint="0402" pcbX={-6} pcbY={2} />
      <resistor name="A2" resistance="1k" footprint="0402" pcbX={6} pcbY={2} />
      <resistor
        name="B1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-2}
      />
      <resistor name="B2" resistance="1k" footprint="0402" pcbX={6} pcbY={-2} />

      <trace from="A1.pin1" to="A2.pin1" routingPhaseIndex={0} />
      <trace from="B1.pin1" to="B2.pin1" routingPhaseIndex={1} />

      <pcbnotetext
        pcbX={0}
        pcbY={4.5}
        fontSize={0.5}
        text="Later phase adapts the preloaded upper trace"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  const adaptedPreloadedTraces = pcbTraces.filter(
    (trace) => trace.pcb_trace_id === "phase_0_trace",
  )

  expect(pcbTraces).toHaveLength(2)
  expect(adaptedPreloadedTraces).toHaveLength(1)
  expect(adaptedPreloadedTraces[0]?.route).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
