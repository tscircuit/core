import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routeDirectly = (
  simpleRouteJson: SimpleRouteJson,
): SimplifiedPcbTrace[] =>
  simpleRouteJson.connections.map((connection, index) => ({
    type: "pcb_trace",
    pcb_trace_id: `pcb_trace_component_id_${index}`,
    connection_name: connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width:
        connection.nominalTraceWidth ??
        simpleRouteJson.nominalTraceWidth ??
        simpleRouteJson.minTraceWidth,
      layer: point.layer,
    })),
  }))

test("simple route json sent to a custom autorouter includes obstacle component ids", async () => {
  const { circuit } = getTestFixture()
  let receivedSimpleRouteJson: SimpleRouteJson | null = null

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          receivedSimpleRouteJson = structuredClone(simpleRouteJson)
          return routeDirectly(simpleRouteJson)
        }),
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R_OBSTACLE"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
      <led name="LED1" footprint="0603" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(receivedSimpleRouteJson).toBeTruthy()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "R_OBSTACLE",
  })!
  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!
  const padIds = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
    .map((pad) => pad.pcb_smtpad_id)

  const obstacleComponentIds = receivedSimpleRouteJson!.obstacles
    .filter((obstacle) =>
      obstacle.connectedTo.some((connectedId) => padIds.includes(connectedId)),
    )
    .map((obstacle) => obstacle.componentId)

  expect(new Set(obstacleComponentIds)).toEqual(
    new Set([pcbComponent.pcb_component_id]),
  )
})
