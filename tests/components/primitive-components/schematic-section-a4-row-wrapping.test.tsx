import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection wraps rows within the A4 sheet drawing width", () => {
  const { circuit } = getTestFixture()

  const CAPS: Array<[string, number]> = [
    ["A", 12],
    ["B", 8],
    ["C", 8],
    ["D", 4],
    ["E", 4],
  ]

  const sectionElements: any[] = []
  CAPS.forEach(([section, capCount], j) => {
    const chipName = `U${j + 1}`
    sectionElements.push(
      <chip
        name={chipName}
        footprint="soic16"
        schSheetName="main"
        schSectionName={section}
      />,
    )
    for (let i = 0; i < capCount; i++) {
      const capName = `C${100 * j + i + 1}`
      sectionElements.push(
        <capacitor
          name={capName}
          capacitance="1uF"
          footprint="0603"
          schSheetName="main"
          schSectionName={section}
        />,
        <trace
          from={`.${chipName} > .pin${i + 1}`}
          to={`.${capName} > .pin1`}
        />,
        <trace from={`.${capName} > .pin2`} to="net.GND" />,
      )
    }
  })

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <schematicsheet name="main" displayName="Main">
        <schematicsection name="A" displayName="Section A" />
        <schematicsection name="B" displayName="Section B" />
        <schematicsection name="C" displayName="Section C" />
        <schematicsection name="D" displayName="Section D" />
        <schematicsection name="E" displayName="Section E" />
      </schematicsheet>
      {sectionElements}
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const outsideSheetWarnings = circuitJson.filter(
    (el) => el.type === "schematic_element_outside_sheet_warning",
  )
  expect(outsideSheetWarnings).toHaveLength(0)

  const components = circuitJson.filter(
    (el) => el.type === "schematic_component",
  )
  const minX = Math.min(...components.map((c) => c.center.x - c.size.width / 2))
  const maxX = Math.max(...components.map((c) => c.center.x + c.size.width / 2))
  expect(maxX - minX).toBeLessThan(31.07)
})
