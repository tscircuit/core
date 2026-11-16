import { any_circuit_element } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export async function renderBoardWidthSrjRoundTrip() {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      minTraceWidth={0.1}
      defaultTraceWidth="0.35mm"
      routingDisabled
      schematicDisabled
    >
      <resistor name="R1" resistance={100} footprint="1206" pcbX={-4} />
      <resistor name="R2" resistance={100} footprint="1206" pcbX={4} />
      <trace name="BOARD_DEFAULT" from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace
        name="EXPLICIT_WIDTH"
        from=".R1 > .pin2"
        to=".R2 > .pin2"
        thickness="0.55mm"
      />
      <pcbnotetext
        pcbY={4}
        fontSize={0.55}
        text="Board default 0.35 mm, minimum 0.10 mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const savedCircuitJson = JSON.stringify(circuit.getCircuitJson())
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: any_circuit_element
      .array()
      .parse(JSON.parse(savedCircuitJson)),
  })

  const getConnectionWidth = (traceName: string) => {
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
    return connection.nominalTraceWidth
  }

  return {
    circuit,
    widths: {
      minTraceWidth: srj.minTraceWidth,
      nominalTraceWidth: srj.nominalTraceWidth,
      defaultConnectionWidth: getConnectionWidth("BOARD_DEFAULT"),
      explicitConnectionWidth: getConnectionWidth("EXPLICIT_WIDTH"),
    },
  }
}
