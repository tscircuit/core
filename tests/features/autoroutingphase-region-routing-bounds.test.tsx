import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("non-reroute autorouting phase region does not constrain routing bounds", async () => {
  const { circuit } = getTestFixture()
  let phaseInput: SimpleRouteJson | undefined
  const autorouter = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      phaseInput = structuredClone(simpleRouteJson)
      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => ({
          type: "pcb_trace",
          pcb_trace_id: `${connection.name}_routed`,
          connection_name: connection.source_trace_id ?? connection.name,
          source_trace_id: connection.source_trace_id,
          route: connection.pointsToConnect.map((point) => ({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: connection.nominalTraceWidth ?? 0.15,
            layer: point.layer,
          })),
        }),
      )
    },
  )

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <autoroutingphase
        phaseIndex={0}
        region={{
          shape: "rect",
          minX: -5,
          maxX: 5,
          minY: -3,
          maxY: 3,
        }}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: autorouter,
        }}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(phaseInput).toBeDefined()
  expect(phaseInput!.bounds).toEqual({
    minX: -20,
    maxX: 20,
    minY: -10,
    maxY: 10,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
