import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getEmbeddedSchematicGraphicSvgContent } from "./get-embedded-schematic-graphic-svg-content"

const assetSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="blue" /></svg>'
const fallbackSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="red" /></svg>'

test("schematic graphic keeps explicit SVG content as an image URL fallback", async () => {
  const { circuit } = getTestFixture()
  const imageUrl = `data:image/svg+xml,${encodeURIComponent(assetSvg)}`

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic imageUrl={imageUrl} svgContent={fallbackSvg} />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_graphic.list()).toEqual([
    expect.objectContaining({
      type: "schematic_graphic",
      asset: {
        project_relative_path: "inline",
        url: imageUrl,
        mimetype: "image/svg+xml",
      },
      svg_content: fallbackSvg,
    }),
  ])

  const renderedSvg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson())
  const embeddedSvgContent = getEmbeddedSchematicGraphicSvgContent(renderedSvg)
  expect(embeddedSvgContent).toBe(assetSvg)
  expect(embeddedSvgContent).not.toBe(fallbackSvg)
})
