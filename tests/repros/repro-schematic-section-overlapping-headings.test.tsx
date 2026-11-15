import { expect, test } from "bun:test"
import { doBoundsOverlap } from "@tscircuit/math-utils"
import {
  getSchematicComponentWithTextBounds,
  getSchematicTextBounds,
} from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getTitleBounds = (
  circuit: ReturnType<typeof getTestFixture>["circuit"],
  title: string,
) => {
  const text = circuit.db.schematic_text
    .list()
    .find((entry) => entry.text === title)
  expect(text).toBeDefined()
  return {
    text: text!,
    bounds: getSchematicTextBounds({
      text: text!.text,
      position: text!.position,
      anchor: text!.anchor,
      fontSize: text!.font_size,
    }),
  }
}

test("L-shaped Power and Controller schematic section headings stay separate and above their own members", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="AQI" sheetWidth={70} sheetHeight={65}>
        <schematicsection name="power" displayName="Power" />
        <schematicsection name="controller" displayName="Controller" />
        <schematictext
          text="Power and Controller headings stay separate"
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

  const power = getTitleBounds(circuit, "Power")
  const controller = getTitleBounds(circuit, "Controller")

  expect(doBoundsOverlap(power.bounds, controller.bounds)).toBe(false)
  expect(controller.text.position.x).toBeLessThan(0)
  expect(power.text.position.x).toBeGreaterThan(0)

  for (const resistor of circuit.db.schematic_component.list()) {
    const resistorBounds = getSchematicComponentWithTextBounds({
      db: circuit.db,
      schematicComponent: resistor,
    })!
    expect(doBoundsOverlap(power.bounds, resistorBounds)).toBe(false)
    expect(doBoundsOverlap(controller.bounds, resistorBounds)).toBe(false)
  }
})

test("tucked-under schematic section heading anchors above its own member when upper corner belongs to another section", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  circuit.add(
    <board routingDisabled>
      <schematicsection name="power" displayName="Power" />
      <schematicsection name="controller" displayName="Controller" />
      <resistor
        name="R1"
        resistance="10k"
        schX={-2}
        schY={-2}
        schSectionName="power"
      />
      <resistor
        name="R3"
        resistance="10k"
        schX={-2}
        schY={1}
        schSectionName="controller"
      />
      <resistor
        name="R4"
        resistance="10k"
        schX={2}
        schY={-2}
        schSectionName="controller"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const power = getTitleBounds(circuit, "Power")
  const controller = getTitleBounds(circuit, "Controller")

  expect(doBoundsOverlap(power.bounds, controller.bounds)).toBe(false)
  expect(power.text.position.y).toBeLessThan(0)
  expect(controller.text.position.y).toBeGreaterThan(1)
})
