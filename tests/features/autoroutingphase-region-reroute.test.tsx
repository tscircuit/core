import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase can reroute middle components with a zigzag route", async () => {
  const { circuit: beforeRerouteCircuit } = getTestFixture()
  const { circuit: afterRerouteCircuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  const rerouteConnectionNames: string[] = []

  const routeStraightThroughRegion = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => {
          return {
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
          }
        },
      )
    },
  )

  const routeRerouteRegion = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      phaseInputs.push(structuredClone(simpleRouteJson))
      rerouteConnectionNames.push(
        ...simpleRouteJson.connections.map((connection) => connection.name),
      )

      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => {
          const [start, end] = connection.pointsToConnect as Array<{
            x: number
            y: number
            layer: string
          }>
          return {
            type: "pcb_trace",
            pcb_trace_id: `${connection.name}_routed`,
            connection_name: connection.name,
            route: [
              {
                route_type: "wire",
                x: start.x,
                y: start.y,
                width: connection.nominalTraceWidth ?? 0.15,
                layer: start.layer,
              },
              {
                route_type: "wire",
                x: start.x + 0.8,
                y: 0.8,
                width: connection.nominalTraceWidth ?? 0.15,
                layer: start.layer,
              },
              {
                route_type: "wire",
                x: start.x + 1.6,
                y: -0.8,
                width: connection.nominalTraceWidth ?? 0.15,
                layer: start.layer,
              },
              {
                route_type: "wire",
                x: end.x - 1.6,
                y: 0.8,
                width: connection.nominalTraceWidth ?? 0.15,
                layer: end.layer,
              },
              {
                route_type: "wire",
                x: end.x - 0.8,
                y: -0.8,
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
    },
  )

  const addCircuit = (
    circuit: typeof beforeRerouteCircuit,
    includeReroutePhase: boolean,
  ) => {
    circuit.add(
      <board width="18mm" height="12mm">
        <resistor
          name="T1"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={3}
        />
        <resistor
          name="T2"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={3}
        />
        <resistor
          name="M1"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={0}
        />
        <resistor
          name="M2"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={0}
        />
        <resistor
          name="B1"
          resistance="1k"
          footprint="0402"
          pcbX={-7}
          pcbY={-3}
        />
        <resistor
          name="B2"
          resistance="1k"
          footprint="0402"
          pcbX={7}
          pcbY={-3}
        />
        <autoroutingphase
          phaseIndex={0}
          autorouter={{
            local: true,
            groupMode: "subcircuit",
            algorithmFn: routeStraightThroughRegion,
          }}
        />
        {includeReroutePhase && (
          <autoroutingphase
            phaseIndex={1}
            reroute
            minTraceWidth="0.42mm"
            minViaHoleDiameter={0.24}
            minViaPadDiameter={0.62}
            minViaHoleEdgeToViaHoleEdgeClearance={0.13}
            minPlatedHoleDrillEdgeToDrillEdgeClearance={0.21}
            minTraceToPadEdgeClearance={0.11}
            minPadEdgeToPadEdgeClearance={0.12}
            minBoardEdgeClearance={0.31}
            minViaEdgeToPadEdgeClearance={0.14}
            region={{
              shape: "rect",
              minX: -2,
              maxX: 2,
              minY: -1,
              maxY: 1,
            }}
            autorouter={{
              local: true,
              groupMode: "subcircuit",
              algorithmFn: routeRerouteRegion,
            }}
          />
        )}
        <trace from=".T1 > .pin1" to=".T2 > .pin1" routingPhaseIndex={0} />
        <trace from=".M1 > .pin1" to=".M2 > .pin1" routingPhaseIndex={0} />
        <trace from=".B1 > .pin1" to=".B2 > .pin1" routingPhaseIndex={0} />
      </board>,
    )
  }

  addCircuit(beforeRerouteCircuit, false)
  addCircuit(afterRerouteCircuit, true)

  await beforeRerouteCircuit.renderUntilSettled()
  await afterRerouteCircuit.renderUntilSettled()

  expect(beforeRerouteCircuit).toMatchPcbSnapshot(
    `${import.meta.path}-before-reroute`,
  )
  expect(afterRerouteCircuit).toMatchPcbSnapshot(
    `${import.meta.path}-after-reroute`,
  )

  const pcbTraces = afterRerouteCircuit.db.pcb_trace.list()
  expect(phaseInputs).toHaveLength(1)
  expect(phaseInputs[0]!.connections).toHaveLength(1)
  expect(phaseInputs[0]!.bounds).toEqual({
    minX: -2.075,
    maxX: 2.075,
    minY: -1,
    maxY: 1,
  })
  expect(phaseInputs[0]!.minTraceWidth).toBe(0.42)
  expect(phaseInputs[0]!.minViaHoleDiameter).toBe(0.24)
  expect(phaseInputs[0]!.minViaPadDiameter).toBe(0.62)
  expect(phaseInputs[0]!.min_via_hole_diameter).toBe(0.24)
  expect(phaseInputs[0]!.min_via_pad_diameter).toBe(0.62)
  expect(phaseInputs[0]!.minViaHoleEdgeToViaHoleEdgeClearance).toBe(0.13)
  expect(phaseInputs[0]!.minPlatedHoleDrillEdgeToDrillEdgeClearance).toBe(0.21)
  expect(phaseInputs[0]!.minTraceToPadEdgeClearance).toBe(0.11)
  expect(phaseInputs[0]!.minPadEdgeToPadEdgeClearance).toBe(0.12)
  expect(phaseInputs[0]!.minBoardEdgeClearance).toBe(0.31)
  expect(phaseInputs[0]!.minViaEdgeToPadEdgeClearance).toBe(0.14)
  expect(phaseInputs[0]!.connections[0]!.nominalTraceWidth).toBe(0.42)
  expect(rerouteConnectionNames).toHaveLength(1)
  expect(rerouteConnectionNames[0]).toContain("_reroute_")
  expect(pcbTraces).toHaveLength(5)
  expect(pcbTraces.every((trace) => trace.source_trace_id)).toBe(true)
  expect(
    pcbTraces.some((trace) =>
      trace.route.every((point) => point.route_type === "wire" && point.y > 2),
    ),
  ).toBe(true)
  expect(
    pcbTraces.some((trace) =>
      trace.route.every((point) => point.route_type === "wire" && point.y < -2),
    ),
  ).toBe(true)
  expect(
    pcbTraces.some(
      (trace) =>
        trace.route.filter((point) => point.route_type === "wire").length ===
          6 &&
        trace.route.some(
          (point) => point.route_type === "wire" && point.y === 0.8,
        ) &&
        trace.route.some(
          (point) => point.route_type === "wire" && point.y === -0.8,
        ),
    ),
  ).toBe(true)
  expect(
    pcbTraces.some(
      (trace) =>
        trace.route.filter((point) => point.route_type === "wire").length ===
          6 &&
        trace.route.every(
          (point) => point.route_type === "wire" && point.width === 0.42,
        ),
    ),
  ).toBe(true)
  expect(
    pcbTraces.some((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          Math.abs(point.x) < 0.01 &&
          Math.abs(point.y) < 0.01,
      ),
    ),
  ).toBe(false)
})
