import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "regenerated SRJ uses the board default for traces without an explicit width",
  async () => {
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
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        <trace from=".R1 > .pin2" to=".R2 > .pin2" thickness="0.55mm" />
        <pcbnotetext
          pcbY={4}
          fontSize={0.55}
          text="Board default 0.35 mm, minimum 0.10 mm"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: JSON.parse(JSON.stringify(circuit.getCircuitJson())),
    })
    const connectionWidths = srj.connections.map(
      (connection) => connection.nominalTraceWidth,
    )
    expect({
      minTraceWidth: srj.minTraceWidth,
      nominalTraceWidth: srj.nominalTraceWidth,
      connectionWidths,
    }).toMatchInlineSnapshot(`
      {
        "connectionWidths": [
          0.1,
          0.55,
        ],
        "minTraceWidth": 0.1,
        "nominalTraceWidth": undefined,
      }
    `)

    circuit.db.pcb_note_text.insert({
      text: `SRJ pin 1 ${connectionWidths[0]} mm, pin 2 ${connectionWidths[1]} mm`,
      anchor_position: { x: 0, y: -4 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.55,
    })
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)

    expect(connectionWidths[0]).toBe(0.35)
  },
)
