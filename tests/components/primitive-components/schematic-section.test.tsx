import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection draws dashed box around member components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <schematicsection name="pwr" displayName="Power Supply" />
      <schematicsection name="gnd" displayName="GND" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={-2}
        schY={0}
        schSectionName="pwr"
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        schX={2}
        schY={0}
        schSectionName="pwr"
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={-4}
        schSectionName="gnd"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const schematicBoxes = circuitJson.filter((c) => c.type === "schematic_box")
  expect(schematicBoxes).toHaveLength(0)

  const schematicTexts = circuitJson.filter(
    (c) => c.type === "schematic_text" && (c as any).text === "Power Supply",
  )
  expect(schematicTexts).toHaveLength(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
