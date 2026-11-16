import { any_circuit_element } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export async function renderBoardWidthSrjRoundTrip() {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={18}
      height={10}
      layers={1}
      minTraceWidth={0.1}
      defaultTraceWidth="0.35mm"
      routingDisabled
      schematicDisabled
    >
      <resistor
        name="R1"
        resistance={100}
        footprint="1206"
        pcbX={-5}
        pcbRotation={270}
      />
      <resistor
        name="R2"
        resistance={100}
        footprint="1206"
        pcbX={5}
        pcbRotation={270}
      />
      <trace name="BOARD_DEFAULT" from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace
        name="EXPLICIT_WIDTH"
        from=".R1 > .pin2"
        to=".R2 > .pin2"
        thickness="0.55mm"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.55}
        text="Board default 0.35 mm, minimum 0.10 mm"
      />
      <pcbnotetext
        pcbY={-3.5}
        fontSize={0.55}
        text="Explicit trace width 0.55 mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const savedCircuitJson = JSON.stringify(circuit.getCircuitJson())
  const circuitJson = any_circuit_element
    .array()
    .parse(JSON.parse(savedCircuitJson))
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })

  const getConnection = (traceName: string) => {
    const sourceTraceId = circuit.db.source_trace.getWhere({
      name: traceName,
    })?.source_trace_id
    const connection = sourceTraceId
      ? srj.connections.find(
          ({ source_trace_id }) => source_trace_id === sourceTraceId,
        )
      : undefined
    if (connection?.nominalTraceWidth === undefined) {
      throw new Error(`Missing SRJ nominal width for ${traceName}`)
    }
    return {
      name: connection.name,
      nominalTraceWidth: connection.nominalTraceWidth,
    }
  }

  return {
    circuitJson,
    srj,
    defaultConnection: getConnection("BOARD_DEFAULT"),
    explicitConnection: getConnection("EXPLICIT_WIDTH"),
  }
}
