import { expect, test } from "bun:test"
import { getSchematicTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boxed connector labels stay outside the box after each autolayout rotation", async () => {
  const { circuit } = getTestFixture()
  const pinSides = ["rightSide", "topSide", "leftSide", "bottomSide"] as const

  circuit.add(
    <board routingDisabled>
      {pinSides.map((pinSide, index) => (
        <group
          key={pinSide}
          name={`initial_${pinSide}`}
          subcircuit
          schAutoLayoutEnabled
          schX={(index % 2) * 6}
          schY={-Math.floor(index / 2) * 6}
        >
          <connector
            name={`J${index + 1}`}
            displayName={`Initially ${pinSide}`}
            manufacturerPartNumber="B2B-PH-K-S(LF)(SN)"
            standard="jst_ph"
            pinCount={2}
            pinLabels={{ pin1: "SIGNAL", pin2: "GND" }}
            footprint="pinrow2_p2.54mm"
            schPinArrangement={{ [pinSide]: [1, 2] }}
            connections={{ pin1: "net.SIGNAL", pin2: "net.GND" }}
          />
          <resistor
            name={`R${index + 1}`}
            resistance="10k"
            footprint="0603"
            schRotation={-90}
            connections={{ pin1: "net.V3V3", pin2: "net.SIGNAL" }}
          />
        </group>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const [index] of pinSides.entries()) {
    const sourceConnector = circuit.db.source_component.getWhere({
      name: `J${index + 1}`,
    })!
    const schematicConnector = circuit.db.schematic_component.getWhere({
      source_component_id: sourceConnector.source_component_id,
    })!
    expect(
      circuit.db.schematic_port
        .list({
          schematic_component_id: schematicConnector.schematic_component_id,
        })
        .map((port) => port.facing_direction),
    ).toEqual(["down", "down"])
    const labelBounds = circuit.db.schematic_text
      .list({
        schematic_component_id: schematicConnector.schematic_component_id,
      })
      .map((text) =>
        getSchematicTextBounds({
          text: text.text,
          position: text.position,
          anchor: text.anchor,
          fontSize: text.font_size,
        }),
      )
      .sort((a, b) => a.minY - b.minY)

    expect(labelBounds[0].minY).toBeGreaterThan(
      schematicConnector.center.y + schematicConnector.size.height / 2,
    )
    expect(labelBounds[1].minY).toBeGreaterThan(labelBounds[0].maxY)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
