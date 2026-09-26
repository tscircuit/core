import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

type SourceComponentElement = Extract<
  AnyCircuitElement,
  { type: "source_component" }
>
type SchematicComponentElement = Extract<
  AnyCircuitElement,
  { type: "schematic_component" }
>

test("inflated circuit JSON preserves board and schematic metadata", async () => {
  const renderedCircuitJson = await renderToCircuitJson(
    <board
      width="24mm"
      height="18mm"
      layers={4}
      solderMaskColor="green"
      silkscreenColor="yellow"
      outline={[
        { x: -12, y: -9 },
        { x: 12, y: -9 },
        { x: 10, y: 9 },
        { x: -10, y: 9 },
      ]}
    >
      <schematicsheet
        name="MAIN"
        displayName="Main Sheet"
        sheetWidth="120mm"
        sheetHeight="80mm"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={-8}
        schY={3}
        schSheetName="MAIN"
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        schX={6}
        schY={-2}
        schSheetName="MAIN"
      />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>,
  )
  const importedCircuitJson = renderedCircuitJson.map((element) =>
    element.type === "pcb_board" ? { ...element, num_layers: 4 } : element,
  )
  const originalResistor = importedCircuitJson.find(
    (element): element is SourceComponentElement =>
      element.type === "source_component" && element.name === "R1",
  )
  const originalSchematicComponent = importedCircuitJson.find(
    (element): element is SchematicComponentElement =>
      element.type === "schematic_component" &&
      element.source_component_id === originalResistor?.source_component_id,
  )
  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={importedCircuitJson} />)

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    solder_mask_color: "green",
    silkscreen_color: "yellow",
    outline: expect.any(Array),
  })
  expect(circuit.db.schematic_sheet.list()[0]).toMatchObject({
    name: "MAIN",
    sheet_width: 120,
    sheet_height: 80,
  })
  expect(
    circuit.db.schematic_component.getWhere({
      source_component_id: circuit.db.source_component.getWhere({ name: "R1" })
        ?.source_component_id,
    })?.center,
  ).toEqual(originalSchematicComponent?.center)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
