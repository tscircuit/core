import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase assigns autorouter config to matching trace phases", async () => {
  const { circuit } = getTestFixture()
  const routedConnectionNamesByPhase: string[][] = []
  const routedConnectionCenterXByPhase: number[] = []

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
    <board width="18mm" height="12mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} pcbY={0} />

      <autoroutingphase
        phaseIndex={1}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />

      <trace from=".R3 > .pin1" to=".R4 > .pin1" routingPhaseIndex={1} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedConnectionNamesByPhase).toHaveLength(2)
  expect(routedConnectionNamesByPhase[0]).toHaveLength(1)
  expect(routedConnectionNamesByPhase[1]).toHaveLength(1)
  expect(routedConnectionCenterXByPhase[0]).toBeLessThan(0)
  expect(routedConnectionCenterXByPhase[1]).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
