import { beforeAll, expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, SchematicComponent } from "circuit-json"
import { NormalComponent } from "lib/components/base-components/NormalComponent"
import { SchematicSection } from "lib/components/primitive-components/SchematicSection"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import motorDriverJson from "./assets/rp2040-motor-controller-motor-driver.circuit.json"

// https://tscircuit.com/imrishabh18/rp2040-motor-controller#schematic
// Version 1.0.42, complete motor_driver sheet (19 components).
// Release e8d285f7-c3d8-46f5-9a54-344fdde0124e, dist/index/circuit.json.
// Fixture preserves the published schematic and source connection metadata;
// unrelated sheets and PCB records are omitted.
const publishedJson = motorDriverJson as AnyCircuitElement[]
const regressionTest = process.env.TSCIRCUIT_ENABLE_RP2040_DIVIDER_REPRO
  ? test
  : test.failing
let resistorSymbol: SchematicComponent
let driverSectionRight: number

beforeAll(async () => {
  const publishedDb = cju(structuredClone(publishedJson))
  const publishedSymbols = publishedDb.schematic_component.list()
  const sheet = publishedDb.schematic_sheet.list()[0]
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board routingDisabled>
      <schematicsection name="driver" displayName="H-Bridge, Power & Control" />
      <schematicsection name="output" displayName="Stepper Motor Output" />
      {publishedSymbols.map((symbol) => (
        <chip
          key={symbol.schematic_component_id}
          name={
            publishedDb.source_component.get(symbol.source_component_id!)!.name
          }
          pinLabels={{}}
          schX={symbol.center.x}
          schY={symbol.center.y}
          schWidth={symbol.size.width}
          schHeight={symbol.size.height}
          schSectionName={
            symbol.schematic_group_id === "schematic_group_8"
              ? "driver"
              : "output"
          }
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  // Restore the real symbols, ports, wires and annotations, rather than
  // substituting boxes for the board's actual passive-component symbols.
  circuit.db = publishedDb
  for (const symbol of publishedSymbols) {
    const source = publishedDb.source_component.get(
      symbol.source_component_id!,
    )!
    const component = circuit.selectOne(`.${source.name}`) as NormalComponent
    component.schematic_component_id = symbol.schematic_component_id
  }
  const board = circuit.firstChild!
  const section = board
    .getDescendants()
    .find(
      (component): component is SchematicSection =>
        component instanceof SchematicSection,
    )!
  const bounds = section._computeSectionBounds(
    board,
    "driver",
    sheet.schematic_sheet_id,
  )
  expect(bounds).not.toBeNull()
  driverSectionRight = bounds!.maxX
  const source = publishedDb.source_component
    .list()
    .find((component) => component.name === "R_DRV_ENABLE_PU")!
  resistorSymbol = publishedSymbols.find(
    (symbol) => symbol.source_component_id === source.source_component_id,
  )!
  expect(publishedSymbols).toHaveLength(19)

  // Display the full affected sheet. Only the outer A4 paper frame is removed
  // from viewport fitting; all original components, wires and labels remain.
  await expect(
    publishedJson.filter((element) => element.type !== "schematic_sheet"),
  ).toMatchSchematicSnapshot(import.meta.path, { width: 1100, height: 1400 })
})

regressionTest(
  "motor_driver section bounds must include the complete resistor reference",
  () => {
    // boxresistor_up places {REF} at +0.16. Core reserves 0.12 units per character.
    const referenceRight =
      resistorSymbol.center.x + 0.16 + "R_DRV_ENABLE_PU".length * 0.12
    expect(driverSectionRight).toBeGreaterThanOrEqual(referenceRight)
  },
)
