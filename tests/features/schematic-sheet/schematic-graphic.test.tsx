import { expect, test } from "bun:test"
import { convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getEmbeddedSchematicGraphicSvgContent } from "./get-embedded-schematic-graphic-svg-content"

const systemBlockDiagram = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
    <rect width="800" height="400" fill="#f8fafc" />
    <g fill="#dbeafe" stroke="#1d4ed8" stroke-width="4">
      <rect x="60" y="140" width="180" height="120" rx="12" />
      <rect x="310" y="140" width="180" height="120" rx="12" />
      <rect x="560" y="140" width="180" height="120" rx="12" />
    </g>
    <g fill="#1e3a8a" font-family="sans-serif" font-size="30" text-anchor="middle">
      <text x="150" y="210">Sensors</text>
      <text x="400" y="210">Controller</text>
      <text x="650" y="210">Outputs</text>
    </g>
    <g stroke="#1d4ed8" stroke-width="6">
      <path d="M240 200h70" />
      <path d="M490 200h70" />
    </g>
  </svg>
`

test("schematic graphic renders as the first page of a multi-sheet schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic svgContent={systemBlockDiagram} />
      </schematicsheet>
      <schematicsheet
        name="Detailed Schematic"
        displayName="Detailed Schematic"
      >
        <resistor name="R1" resistance="1k" footprint="0402" schX={-1} />
        <capacitor name="C1" capacitance="100nF" footprint="0402" schX={1} />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheet = circuit.db.schematic_sheet.getWhere({
    name: "Sheet 1",
  })
  expect(circuit.db.schematic_graphic.list()).toEqual([
    expect.objectContaining({
      type: "schematic_graphic",
      schematic_sheet_id: schematicSheet?.schematic_sheet_id,
      asset: {
        project_relative_path: "inline",
        url: `data:image/svg+xml,${encodeURIComponent(systemBlockDiagram)}`,
        mimetype: "image/svg+xml",
      },
    }),
  ])
  expect(circuit.db.schematic_graphic.list()[0]).not.toHaveProperty(
    "svg_content",
  )
  expect(circuit.db.schematic_graphic.list()[0]).not.toHaveProperty("width")
  expect(circuit.db.schematic_graphic.list()[0]).not.toHaveProperty("height")

  expect(
    circuit.db.schematic_sheet
      .list()
      .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
      .map((sheet) => [sheet.name, sheet.sheet_index]),
  ).toEqual([
    ["Sheet 1", 0],
    ["Detailed Schematic", 1],
  ])

  const stackedSvg = convertCircuitJsonToStackedSchematicSheetsSvg(
    circuit.getCircuitJson(),
  )
  const firstSheetLabelIndex = stackedSvg.indexOf(
    'data-schematic-sheet-id="schematic_sheet_0">Sheet 1</text>',
  )
  const graphicIndex = stackedSvg.indexOf(
    'data-schematic-graphic-id="schematic_graphic_0"',
  )
  const detailedSheetLabelIndex = stackedSvg.indexOf(
    ">Detailed Schematic</text>",
  )

  expect(firstSheetLabelIndex).toBeGreaterThanOrEqual(0)
  expect(graphicIndex).toBeGreaterThan(firstSheetLabelIndex)
  expect(detailedSheetLabelIndex).toBeGreaterThan(graphicIndex)
  expect(getEmbeddedSchematicGraphicSvgContent(stackedSvg)).toBe(
    systemBlockDiagram,
  )

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path, {
    grid: false,
  })

  const { circuit: mixedIndexCircuit } = getTestFixture()
  mixedIndexCircuit.add(
    <board routingDisabled>
      <schematicsheet name="Implicit Root Sheet" />
      <subcircuit name="Nested Subcircuit">
        <schematicsheet name="Nested Explicit First Sheet" sheetIndex={0} />
      </subcircuit>
      <schematicsheet name="Implicit Tail Sheet" />
    </board>,
  )
  await mixedIndexCircuit.renderUntilSettled()

  expect(
    mixedIndexCircuit.db.schematic_sheet
      .list()
      .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
      .map((sheet) => [sheet.name, sheet.sheet_index]),
  ).toEqual([
    ["Nested Explicit First Sheet", 0],
    ["Implicit Root Sheet", 1],
    ["Implicit Tail Sheet", 2],
  ])
})
