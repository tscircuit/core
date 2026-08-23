import { expect, test } from "bun:test"
import type { AutorouterProp } from "@tscircuit/props"
import type { Board } from "lib/components/normal-components/Board"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting phases inherit the board autorouter", async () => {
  const { circuit } = getTestFixture()
  const routedConnectionCountsByPhase: number[] = []
  const boardAutorouter: AutorouterProp = {
    local: true,
    groupMode: "subcircuit",
    algorithmFn: createBasicAutorouter(
      async (simpleRouteJson: SimpleRouteJson) => {
        routedConnectionCountsByPhase.push(simpleRouteJson.connections.length)
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
      },
    ),
  }

  circuit.add(
    <board width="18mm" height="10mm" autorouter={boardAutorouter}>
      <autoroutingphase phaseIndex={0} />

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-2} pcbY={2} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={2} pcbY={-2} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={6} pcbY={-2} />

      <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
      <trace from=".R3 > .pin1" to=".R4 > .pin1" routingPhaseIndex={1} />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.45}
        text="Both phases use the board autorouter"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routingPhasePlans = (
    circuit.firstChild as Board
  )._getRoutingPhasePlans()
  expect(routingPhasePlans).toHaveLength(2)
  expect(routingPhasePlans.map((plan) => plan.autorouter)).toEqual([
    boardAutorouter,
    boardAutorouter,
  ])
  expect(routedConnectionCountsByPhase).toEqual([1, 1])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
