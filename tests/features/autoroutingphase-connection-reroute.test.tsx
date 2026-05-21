import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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

const createZigzagRerouteAutorouter = () =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
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
  const renderCircuitAndMatchPcbSnapshot = async (
    circuit: ReturnType<typeof getTestFixture>["circuit"],
    snapshotName: string,
  ) => {
    await circuit.renderUntilSettled()
    expect(circuit).toMatchPcbSnapshot(snapshotName)
  }

  const { circuit: singleConnectionCircuit } = getTestFixture()

  singleConnectionCircuit.add(
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
      <resistor name="V1" resistance="1k" footprint="0402" pcbX={5} pcbY={-7} />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={5} pcbY={7} />
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          algorithmFn: createStraightAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        reroute
        connection="H1.pin1"
        autorouter={{
          algorithmFn: createZigzagRerouteAutorouter(),
        }}
      />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" routingPhaseIndex={0} />
      <trace from=".H3 > .pin1" to=".H4 > .pin1" routingPhaseIndex={0} />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" routingPhaseIndex={0} />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    singleConnectionCircuit,
    `${import.meta.path}-single-connection`,
  )

  const { circuit: connectionsArrayCircuit } = getTestFixture()

  connectionsArrayCircuit.add(
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
      <resistor name="V1" resistance="1k" footprint="0402" pcbX={5} pcbY={-7} />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={5} pcbY={7} />
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          algorithmFn: createStraightAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        reroute
        connections={["H1.pin1", "V1.pin1"]}
        autorouter={{
          algorithmFn: createZigzagRerouteAutorouter(),
        }}
      />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" routingPhaseIndex={0} />
      <trace from=".H3 > .pin1" to=".H4 > .pin1" routingPhaseIndex={0} />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" routingPhaseIndex={0} />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    connectionsArrayCircuit,
    `${import.meta.path}-connections-array`,
  )
})
