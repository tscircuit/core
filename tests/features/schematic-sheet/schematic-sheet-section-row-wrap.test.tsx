import { expect, test } from "bun:test"
import { getSchematicSheetContentSize } from "lib/utils/schematic/warn-if-schematic-elements-outside-sheet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("wraps unanchored schematic sections onto new rows within schematicsheet content width", async () => {
  const { circuit } = getTestFixture()
  const CAPS: Record<string, number> = { A: 12, B: 8, C: 8, D: 4, E: 4 }

  const sectionElements = []
  const capacitorElements = []
  for (const [secName, count] of Object.entries(CAPS)) {
    sectionElements.push(
      <schematicsection name={secName} displayName={`Section ${secName}`} />,
    )
    for (let i = 1; i <= count; i++) {
      capacitorElements.push(
        <capacitor
          name={`C_${secName}${i}`}
          capacitance="100nF"
          footprint="0402"
          schSheetName="Sheet1"
          schSectionName={secName}
          connections={{
            pin1: "net.VCC",
            pin2: "net.GND",
          }}
        />,
      )
    }
  }

  circuit.add(
    <board width="100mm" height="100mm" routingDisabled>
      <schematicsheet name="Sheet1" displayName="Sheet 1" sheetIndex={0}>
        {sectionElements}
      </schematicsheet>

      <net name="VCC" />
      <net name="GND" />

      {capacitorElements}
    </board>,
  )

  await circuit.renderUntilSettled()

  const sheets = circuit.db.schematic_sheet.list()
  expect(sheets).toHaveLength(1)

  const warnings = circuit.db.schematic_element_outside_sheet_warning.list()
  expect(warnings).toHaveLength(0)

  const sheet = sheets[0]!
  const { width: maxContentWidth } = getSchematicSheetContentSize({
    sheetWidth: sheet.sheet_width!,
    sheetHeight: sheet.sheet_height!,
  })

  const sectionRowYs = new Set<number>()
  for (const name of Object.keys(CAPS)) {
    const sectionComps = circuit.db.schematic_component
      .list()
      .filter((comp) => {
        if (!comp.source_component_id) return false
        const src = circuit.db.source_component.get(comp.source_component_id)
        return src?.name.startsWith(`C_${name}`)
      })
    expect(sectionComps.length).toBe(CAPS[name])
    const avgY =
      sectionComps.reduce((sum, c) => sum + c.center.y, 0) / sectionComps.length
    sectionRowYs.add(Math.round(avgY))
  }
  expect(sectionRowYs.size).toBeGreaterThanOrEqual(2)

  const allSchComps = circuit.db.schematic_component.list()
  const minX = Math.min(
    ...allSchComps.map((c) => c.center.x - c.size.width / 2),
  )
  const maxX = Math.max(
    ...allSchComps.map((c) => c.center.x + c.size.width / 2),
  )
  expect(maxX - minX).toBeLessThanOrEqual(maxContentWidth)
}, 30_000)

test("places a single wide section wider than sheet content width without infinite loops", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="100mm" routingDisabled>
      <schematicsheet
        name="NarrowSheet"
        displayName="Narrow Sheet"
        sheetIndex={0}
        sheetWidth={80}
        sheetHeight={210}
      >
        <schematicsection name="LEFT" displayName="Left" />
        <schematicsection name="RIGHT" displayName="Right" />
      </schematicsheet>

      <chip
        name="U_WIDE"
        footprint="soic16"
        schSheetName="NarrowSheet"
        schSectionName="LEFT"
        schWidth={10}
        schHeight={4}
      />
      <resistor
        name="R_SECOND"
        resistance="1k"
        footprint="0402"
        schSheetName="NarrowSheet"
        schSectionName="RIGHT"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const comps = circuit.db.schematic_component.list()
  expect(comps).toHaveLength(2)
  const wideComp = comps.find(
    (c) =>
      Boolean(c.source_component_id) &&
      circuit.db.source_component.get(c.source_component_id!)?.name ===
        "U_WIDE",
  )!
  const secondComp = comps.find(
    (c) =>
      Boolean(c.source_component_id) &&
      circuit.db.source_component.get(c.source_component_id!)?.name ===
        "R_SECOND",
  )!
  expect(wideComp.center.y).toBeGreaterThan(secondComp.center.y)
}, 20_000)
