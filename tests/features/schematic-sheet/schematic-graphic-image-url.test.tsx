import { expect, test } from "bun:test"
import { convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import schematicGraphicSvgPath from "../../fixtures/assets/schematic-graphic.svg"
import { getEmbeddedSchematicGraphicSvgContent } from "./get-embedded-schematic-graphic-svg-content"

test("schematic graphic loads a sized SVG image URL exactly once", async () => {
  const svgContent = await Bun.file(schematicGraphicSvgPath).text()
  const imageUrl = `data:image/svg+xml,${encodeURIComponent(svgContent)}`
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic imageUrl={imageUrl} width="20mm" height="10mm" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()
  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_graphic.list()).toEqual([
    expect.objectContaining({
      type: "schematic_graphic",
      asset: {
        project_relative_path: "inline",
        url: imageUrl,
        mimetype: "image/svg+xml",
      },
      width: 20,
      height: 10,
    }),
  ])
  expect(circuit.db.schematic_graphic.list()[0]).not.toHaveProperty(
    "svg_content",
  )

  const stackedSvg = convertCircuitJsonToStackedSchematicSheetsSvg(
    circuit.getCircuitJson(),
  )
  expect(stackedSvg).toContain("<image ")
  expect(getEmbeddedSchematicGraphicSvgContent(stackedSvg)).toBe(svgContent)
})
