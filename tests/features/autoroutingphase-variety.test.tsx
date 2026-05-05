import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase supports net phases nested groups and configured phase autorouters", async () => {
  const { circuit } = getTestFixture()
  const routedConnectionCountsByPhase: number[] = []
  const routedConnectionCenterYByPhase: number[] = []

  const createPhaseAutorouter = () =>
    createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
      routedConnectionCountsByPhase.push(simpleRouteJson.connections.length)
      routedConnectionCenterYByPhase.push(
        simpleRouteJson.connections.reduce((connectionSum, connection) => {
          const centerY =
            connection.pointsToConnect.reduce(
              (sum, point) => sum + point.y,
              0,
            ) / connection.pointsToConnect.length
          return connectionSum + centerY
        }, 0) / simpleRouteJson.connections.length,
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
    <board width="24mm" height="18mm">
      <resistor name="G1" resistance="1k" footprint="0402" pcbX={-8} pcbY={5} />
      <resistor name="G2" resistance="1k" footprint="0402" pcbX={-4} pcbY={5} />
      <resistor name="G3" resistance="1k" footprint="0402" pcbX={0} pcbY={5} />
      <resistor name="N1" resistance="1k" footprint="0402" pcbX={-8} pcbY={0} />
      <resistor name="N2" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="X1" resistance="1k" footprint="0402" pcbX={2} pcbY={-5} />
      <resistor name="X2" resistance="1k" footprint="0402" pcbX={6} pcbY={-5} />
      <resistor name="E1" resistance="1k" footprint="0402" pcbX={4} pcbY={2} />
      <resistor name="E2" resistance="1k" footprint="0402" pcbX={8} pcbY={2} />

      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={2}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={3}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />

      <net name="GND" routingPhaseIndex={0} />
      <trace from=".G1 > .pin1" to="net.GND" />
      <trace from=".G2 > .pin1" to="net.GND" />
      <trace from=".G3 > .pin1" to="net.GND" />

      <group>
        <trace from=".N1 > .pin1" to=".N2 > .pin1" routingPhaseIndex={1} />
      </group>

      <trace from=".X1 > .pin1" to=".X2 > .pin1" routingPhaseIndex={3} />
      <trace from=".E1 > .pin1" to=".E2 > .pin1" routingPhaseIndex={2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedConnectionCountsByPhase).toEqual([1, 1, 1, 1])
  expect(routedConnectionCenterYByPhase[0]).toBeGreaterThan(0)
  expect(routedConnectionCenterYByPhase[1]).toBeCloseTo(0, 1)
  expect(routedConnectionCenterYByPhase[2]).toBeGreaterThan(0)
  expect(routedConnectionCenterYByPhase[3]).toBeLessThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
