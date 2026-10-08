import { expect, test } from "bun:test"
import { join } from "node:path"
import { gunzipSync } from "node:zlib"
import type {
  CircuitJson,
  SchematicGraphic,
  SchematicSheet,
  SchematicText,
} from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const tmds62levmSheet05FixturePath = join(
  import.meta.dir,
  "assets/tmds62levm-sheet-05.circuit.json.gz",
)

const loadTmds62levmSheet05 = async (): Promise<CircuitJson> => {
  const compressedCircuitJson = await Bun.file(
    tmds62levmSheet05FixturePath,
  ).arrayBuffer()

  return JSON.parse(
    gunzipSync(compressedCircuitJson).toString("utf8"),
  ) as CircuitJson
}

const createComparisonPanel = ({
  schematicSvg,
  offsetX,
}: {
  schematicSvg: string
  offsetX: number
}): string => {
  const schematicContents = schematicSvg
    .replace(/^<svg[^>]*>/u, "")
    .replace(/<\/svg>\s*$/u, "")

  return `<svg x="${offsetX}" y="30" width="800" height="200" viewBox="300 0 600 150">${schematicContents}</svg>`
}

test("reproduces TMDS62LEVM sheet 05 title shifted into its frame", async () => {
  const sourceCircuitJson = await loadTmds62levmSheet05()
  const sourceSheet = sourceCircuitJson.find(
    (element): element is SchematicSheet => element.type === "schematic_sheet",
  )
  const blockDiagramTitle = sourceCircuitJson.find(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.text === "BLOCK DIAGRAM - AM62L EVM",
  )
  const drawingNumber = sourceCircuitJson.find(
    (element): element is SchematicText =>
      element.type === "schematic_text" && element.text === "PROC181E1-1",
  )
  const blockDiagramGraphic = sourceCircuitJson.find(
    (element): element is SchematicGraphic =>
      element.type === "schematic_graphic",
  )

  if (
    !sourceSheet?.sheet_width ||
    !sourceSheet.sheet_height ||
    !blockDiagramTitle ||
    !drawingNumber ||
    !blockDiagramGraphic?.svg_content
  ) {
    throw new Error("TMDS62LEVM sheet 05 fixture is incomplete")
  }

  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name={sourceSheet.name}
        sheetWidth={`${sourceSheet.sheet_width}mm`}
        sheetHeight={`${sourceSheet.sheet_height}mm`}
      >
        <schematictext
          text={blockDiagramTitle.text}
          schX={blockDiagramTitle.position.x}
          schY={blockDiagramTitle.position.y}
          anchor={blockDiagramTitle.anchor}
          fontSize={blockDiagramTitle.font_size}
          color={blockDiagramTitle.color}
          schRotation={blockDiagramTitle.rotation}
        />
        <schematictext
          text={drawingNumber.text}
          schX={drawingNumber.position.x}
          schY={drawingNumber.position.y}
          anchor={drawingNumber.anchor}
          fontSize={drawingNumber.font_size}
          color={drawingNumber.color}
          schRotation={drawingNumber.rotation}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const renderedSheet = circuit.db.schematic_sheet.list()[0]
  if (!renderedSheet) {
    throw new Error("TMDS62LEVM sheet 05 did not render a schematic sheet")
  }

  expect(renderedSheet).toMatchObject({
    sheet_width: sourceSheet.sheet_width,
    sheet_height: sourceSheet.sheet_height,
  })
  const renderedCircuitJson = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "schematic_graphic")
  const sourceGraphicOnRenderedSheet = {
    ...blockDiagramGraphic,
    schematic_graphic_id: "schematic_graphic_tmds62levm_sheet_05",
    schematic_sheet_id: renderedSheet.schematic_sheet_id,
  } satisfies SchematicGraphic
  const sourceSvg = convertCircuitJsonToSchematicSvg(sourceCircuitJson, {
    width: 1200,
    height: 600,
  })
  const renderedSvg = convertCircuitJsonToSchematicSvg(
    [...renderedCircuitJson, sourceGraphicOnRenderedSheet],
    { width: 1200, height: 600 },
  )
  const comparisonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1624" height="230" viewBox="0 0 1624 230" aria-label="TMDS62LEVM sheet 05 fixed-origin comparison" role="img">
    <rect width="1624" height="230" fill="#fff" />
    <text x="400" y="20" text-anchor="middle" font-family="sans-serif" font-size="16">Source Circuit JSON</text>
    <text x="1224" y="20" text-anchor="middle" font-family="sans-serif" font-size="16">Core output</text>
    ${createComparisonPanel({ schematicSvg: sourceSvg, offsetX: 0 })}
    ${createComparisonPanel({ schematicSvg: renderedSvg, offsetX: 824 })}
  </svg>`

  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
