import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestStaticAssetsServer } from "tests/fixtures/get-test-static-assets-server"
import { getEmbeddedSchematicGraphicSvgContent } from "./get-embedded-schematic-graphic-svg-content"

const explicitFallbackSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="red" /></svg>'

test("schematic graphic keeps a resolved external SVG canonical over explicit fallback", async () => {
  let resolvedProjectPath: string | undefined
  const { url: staticAssetsServerUrl } = getTestStaticAssetsServer()
  const { circuit } = getTestFixture({
    platform: {
      resolveProjectStaticFileImportUrl: async (projectPath) => {
        resolvedProjectPath = projectPath
        return `${staticAssetsServerUrl}/schematic-graphic.svg`
      },
    },
  })
  const imageUrl = "/assets/schematic-graphic.svg"
  const resolvedImageUrl = `${staticAssetsServerUrl}/schematic-graphic.svg`

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic
          imageUrl={imageUrl}
          svgContent={explicitFallbackSvg}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const [schematicGraphic] = circuit.db.schematic_graphic.list()
  expect(resolvedProjectPath).toBe(imageUrl)
  expect(schematicGraphic).toEqual(
    expect.objectContaining({
      type: "schematic_graphic",
      asset: {
        project_relative_path: imageUrl,
        url: resolvedImageUrl,
        mimetype: "image/svg+xml",
      },
      svg_content: expect.stringContaining("<svg"),
    }),
  )
  expect(schematicGraphic?.svg_content).toContain("Input")
  expect(schematicGraphic?.svg_content).not.toBe(explicitFallbackSvg)
  if (schematicGraphic?.svg_content === undefined) {
    throw new Error("Expected the external SVG to be materialized")
  }

  const renderedSvg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson())
  const embeddedSvgContent = getEmbeddedSchematicGraphicSvgContent(renderedSvg)
  expect(renderedSvg).toContain("<image ")
  expect(embeddedSvgContent).toBe(schematicGraphic.svg_content)
  expect(embeddedSvgContent).toContain("Input")
  expect(embeddedSvgContent).not.toBe(explicitFallbackSvg)
})
