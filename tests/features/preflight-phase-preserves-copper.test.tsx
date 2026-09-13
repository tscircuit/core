import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("basic checks each phase and preserves earlier completed copper", async () => {
  const { circuit } = getTestFixture()
  const routedConnectionNamesByPhase: string[][] = []
  const routedConnectionCenterXByPhase: number[] = []
  const autoroutingPhaseNames: string[] = []

  circuit.on("autorouting:start", ({ phaseName }) => {
    if (phaseName) autoroutingPhaseNames.push(phaseName)
  })

  const createPhaseAutorouter = () =>
    createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
      routedConnectionNamesByPhase.push(
        simpleRouteJson.connections.map((connection) => connection.name),
      )
      routedConnectionCenterXByPhase.push(
        simpleRouteJson.connections[0].pointsToConnect.reduce(
          (sum, point) => sum + point.x,
          0,
        ) / simpleRouteJson.connections[0].pointsToConnect.length,
      )
      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => ({
          type: "pcb_trace",
          pcb_trace_id: `${connection.name}_routed`,
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

  circuit.add(
    <board width="18mm" height="12mm" preflightRoutingCheckPolicy="basic">
      <pcbnotetext
        pcbY={-4}
        text="LEFT ROUTED; RIGHT BLOCKED BY LENGTH"
        fontSize={0.5}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} pcbY={0} />

      <autoroutingphase
        phaseIndex={1}
        name="route-signal"
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={0}
        name="route-power"
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />

      <trace
        from=".R3 > .pin1"
        to=".R4 > .pin1"
        routingPhaseIndex={1}
        maxLength={1}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedConnectionNamesByPhase).toHaveLength(1)
  expect(autoroutingPhaseNames).toEqual(["route-power"])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_preflight_routing_error.list()).toMatchObject([
    {
      error_code: "trace_length_exceeded",
      routing_phase_index: 1,
      phase_name: "route-signal",
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
