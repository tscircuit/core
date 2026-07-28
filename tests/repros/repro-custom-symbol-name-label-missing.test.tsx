import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: custom symbol name label missing when is_box_with_pins is false", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="L1"
        pinLabels={{ pin1: ["pin1"], pin2: ["pin2"] }}
        symbol={
          <symbol>
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={5.08}
              schY={0}
              schStemLength={0.762}
            />
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-5.08}
              schY={0}
              schStemLength={0.762}
            />
            <schematicpath
              svgPath="M -4.288282 0.017272 A 1.016 0.9906 0 1 0 -2.265172 0.016256"
              strokeWidth={0.254}
              strokeColor="#880000"
            />
            <schematicpath
              svgPath="M -2.1336 0.018034 A 1.016 0.9906 0 1 0 -0.11049 0.016764"
              strokeWidth={0.254}
              strokeColor="#880000"
            />
            <schematicpath
              svgPath="M 0.017018 0.018034 A 1.016 0.9906 0 1 0 2.040128 0.016764"
              strokeWidth={0.254}
              strokeColor="#880000"
            />
            <schematicpath
              svgPath="M 2.2098 0.017526 A 1.016 0.9906 0 1 0 4.23291 0.016256"
              strokeWidth={0.254}
              strokeColor="#880000"
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const sourceComponent = circuit.db.source_component.getWhere({ name: "L1" })!
  const schComp = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })

  expect(schComp).toBeDefined()
  expect(schComp?.is_box_with_pins).toBe(false)

  // custom symbol components with is_box_with_pins: false get no
  // schematic_text for their name, unlike box components
  const schematicTexts = circuit.db.schematic_text
    .list()
    .filter((t) => t.schematic_component_id === schComp?.schematic_component_id)

  expect(schematicTexts).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
