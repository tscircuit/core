import { beforeAll, expect, test } from "bun:test"
import { doBoundsOverlap } from "@tscircuit/math-utils"
import {
  getSchematicComponentWithTextBounds,
  getSchematicTextBounds,
} from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

const getSectionTitleBounds = (title: string) => {
  const text = circuit.db.schematic_text
    .list()
    .find((text) => text.text === title)!
  return getSchematicTextBounds({
    text: text.text,
    position: text.position,
    anchor: text.anchor,
    fontSize: text.font_size,
  })
}

beforeAll(async () => {
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="AQI" sheetWidth={70} sheetHeight={65}>
        <schematicsection name="power" displayName="Power" />
        <schematicsection name="controller" displayName="Controller" />
        <schematictext
          text="Power and Controller headings overlap above R3"
          schX={0}
          schY={2.4}
          fontSize={0.2}
        />
        <schematictext
          text="R1/R2: Power section; R3: Controller section"
          schX={0}
          schY={-2.5}
          fontSize={0.2}
        />
      </schematicsheet>
      <resistor
        name="R1"
        resistance="10k"
        schX={-2}
        schY={-2}
        schSectionName="power"
        schSheetName="AQI"
      />
      <resistor
        name="R2"
        resistance="10k"
        schX={2}
        schY={1}
        schSectionName="power"
        schSheetName="AQI"
      />
      <resistor
        name="R3"
        resistance="10k"
        schX={-2}
        schY={1}
        schSectionName="controller"
        schSheetName="AQI"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })

  // The component symbols and labels are separated; only the headings collide.
  const resistorBounds = circuit.db.schematic_component.list().map(
    (resistor) =>
      getSchematicComponentWithTextBounds({
        db: circuit.db,
        schematicComponent: resistor,
      })!,
  )
  expect(resistorBounds).toHaveLength(3)
  for (let first = 0; first < resistorBounds.length; first++) {
    for (let second = first + 1; second < resistorBounds.length; second++) {
      expect(
        doBoundsOverlap(resistorBounds[first]!, resistorBounds[second]!),
      ).toBe(false)
    }
  }
}, 30_000)

test.failing(
  "Power and Controller headings stay separate when section bounds overlap",
  () => {
    expect(
      doBoundsOverlap(
        getSectionTitleBounds("Power"),
        getSectionTitleBounds("Controller"),
      ),
    ).toBe(false)
  },
)
