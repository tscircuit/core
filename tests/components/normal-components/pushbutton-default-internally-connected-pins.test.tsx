import { expect, test } from "bun:test"
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import "tests/fixtures/extend-expect-any-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprinter pushbuttons tie pin1-pin2 and pin3-pin4 by default", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm">
      <schematictext
        text="DEFAULT: PINS 1-2 AND 3-4 INTERNALLY CONNECTED, WIRE PIN1 + PIN3"
        fontSize={0.2}
        schY={3}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-9}
        pcbY={3}
        schX={-3}
        schY={1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={9}
        pcbY={3}
        schX={3}
        schY={1}
      />
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        pcbX={-4}
        schX={-1}
        schY={-1}
      />
      <pushbutton
        name="SW2"
        footprint="smdpushbutton"
        pcbX={4}
        schX={5}
        schY={-1}
      />
      <trace from=".R1 > .pin1" to="net.V3V3" />
      <trace from=".R1 > .pin2" to=".SW1 > .pin1" />
      <trace from=".SW1 > .pin3" to="net.GND" />
      <trace from=".R2 > .pin1" to="net.V3V3" />
      <trace from=".R2 > .pin2" to=".SW2 > .pin1" />
      <trace from=".SW2 > .pin3" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { db } = circuit
  for (const name of ["SW1", "SW2"]) {
    const sourceComponent = db.source_component.getWhere({ name })!
    const sourcePorts = db.source_port.list({
      source_component_id: sourceComponent.source_component_id,
    })
    const pinNumberOf = (sourcePortId: string) =>
      sourcePorts.find((p) => p.source_port_id === sourcePortId)?.pin_number
    expect(
      db.source_component_internal_connection
        .list({ source_component_id: sourceComponent.source_component_id })
        .map((ic) => ic.source_port_ids.map(pinNumberOf).sort()),
    ).toEqual([
      [1, 2],
      [3, 4],
    ])

    // Both switch terminals are wired, so no pad is reported as unconnected.
    expect(
      db.source_pin_missing_trace_warning.list({
        source_component_id: sourceComponent.source_component_id,
      }),
    ).toHaveLength(0)

    // pin1 and pin3 land on the two different symbol terminals.
    const schematicComponent = db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const schematicPortCenterOf = (pinNumber: number) => {
      const sourcePort = sourcePorts.find((p) => p.pin_number === pinNumber)!
      const schematicPort = db.schematic_port.getWhere({
        schematic_component_id: schematicComponent.schematic_component_id,
        source_port_id: sourcePort.source_port_id,
      })!
      return schematicPort.center
    }
    expect(schematicPortCenterOf(1)).not.toEqual(schematicPortCenterOf(3))
  }

  const circuitJson = circuit.getCircuitJson()
  const schematicSvg = convertCircuitJsonToSchematicSvg(circuitJson, {
    grid: { cellSize: 1, labelCells: true },
    // stack-svgs combines both SVG contents under one root, so the schematic's
    // .boundary rule also matches the PCB background without this override.
    css: '[data-type="pcb_background"] { fill: #000; }',
  })
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    backgroundColor: "#000",
  })

  expect(
    stackSvgsHorizontally([schematicSvg, pcbSvg], {
      gap: 24,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": "pushbutton-default-internally-connected-schematic-pcb",
      },
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "pushbutton-default-internally-connected-schematic-pcb",
  )
})
