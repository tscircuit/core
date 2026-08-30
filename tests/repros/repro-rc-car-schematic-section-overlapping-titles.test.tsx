import { expect, test } from "bun:test"
import type { SectionId } from "@tscircuit/schematic-trace-solver"
import { SchematicSection } from "lib/components/primitive-components/SchematicSection"
import { Fragment } from "react"
import "tests/fixtures/extend-expect-circuit-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import rcCarCircuitJson from "./assets/rc-car-schematic-section-title-overlap.circuit.json"
import rcCarSolverInput from "./assets/rc-car-schematic-trace-solver-input.json"

const rcCarSections: Array<{
  sectionId: SectionId
  displayName: string
}> = [
  {
    sectionId: "power",
    displayName: "1. 4.5–6 V input and 3.3 V buck",
  },
  {
    sectionId: "esp",
    displayName: "2. ESP-12E boot, reset and decoupling",
  },
  {
    sectionId: "motors",
    displayName: "3. Dual N20 motor driver",
  },
  {
    sectionId: "io",
    displayName: "4. Stackable 2x8 hat interface",
  },
]
const SNAPSHOT_TIMEOUT_MS = 90_000

test(
  "rc car schematic section titles overlap",
  async () => {
    const { circuit } = getTestFixture({
      platform: { pcbDisabled: true },
    })

    circuit.add(
      <board routingDisabled>
        {rcCarSections.map(({ sectionId, displayName }) => (
          <Fragment key={sectionId}>
            <schematicsection name={sectionId} displayName={displayName} />
          </Fragment>
        ))}
        {rcCarSolverInput.chips.map((chip) => {
          if (!chip.sectionId) {
            throw new Error(`Missing sectionId for ${chip.chipId}`)
          }
          return (
            <Fragment key={chip.chipId}>
              <chip
                name={chip.chipId}
                manufacturerPartNumber={chip.chipId}
                pinLabels={{}}
                schX={chip.center.x}
                schY={chip.center.y}
                schWidth={chip.width}
                schHeight={chip.height}
                schSectionName={chip.sectionId}
              />
            </Fragment>
          )
        })}
      </board>,
    )

    await circuit.renderUntilSettled()

    const initialSectionTitles = circuit.db.schematic_text
      .list()
      .filter((schematicText) => schematicText.anchor === "top_left")
    const initialSectionLines = circuit.db.schematic_line
      .list()
      .filter((schematicLine) => schematicLine.is_dashed)
    for (const schematicText of initialSectionTitles) {
      circuit.db.schematic_text.delete(schematicText.schematic_text_id)
    }
    for (const schematicLine of initialSectionLines) {
      circuit.db.schematic_line.delete(schematicLine.schematic_line_id)
    }

    const sectionRenderer = circuit.firstChild
      ?.getDescendants()
      .find(
        (component): component is SchematicSection =>
          component instanceof SchematicSection,
      )
    if (!sectionRenderer) {
      throw new Error("Expected an RC car schematic section renderer")
    }
    sectionRenderer.doInitialSchematicSectionRender()

    const generatedSectionTitles = circuit.db.schematic_text
      .list()
      .filter((schematicText) => schematicText.anchor === "top_left")
    const generatedSectionLines = circuit.db.schematic_line
      .list()
      .filter((schematicLine) => schematicLine.is_dashed)
    const fixedRcCarCircuitJson = [
      ...rcCarCircuitJson.filter((element) => {
        if (element.type === "schematic_line" && element.is_dashed) {
          return false
        }
        if (
          element.type === "schematic_text" &&
          element.anchor === "top_left"
        ) {
          return false
        }
        return true
      }),
      ...generatedSectionLines,
      ...generatedSectionTitles,
    ]

    expect(generatedSectionTitles).toHaveLength(4)
    expect(generatedSectionLines).toHaveLength(2)
    expect(
      generatedSectionTitles.map((sectionTitle) => sectionTitle.position),
    ).toEqual([
      { x: -17.3, y: -1.3549999999999998 },
      { x: -17.3, y: -1.3549999999999998 },
      { x: 4.381249999999999, y: -1.3549999999999998 },
      { x: -17.3, y: -14.160227674999998 },
    ])

    await expect(fixedRcCarCircuitJson).toMatchSchematicSnapshot(
      import.meta.path,
    )
  },
  { timeout: SNAPSHOT_TIMEOUT_MS },
)
