import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestStaticAssetsServer } from "tests/fixtures/get-test-static-assets-server"
import { getEmbeddedSchematicGraphicSvgContent } from "./get-embedded-schematic-graphic-svg-content"

const fallbackSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><rect width="20" height="10" fill="green" /></svg>'

test("schematic graphic uses explicit SVG content when its image URL cannot load", async () => {
  const { url: staticAssetsServerUrl } = getTestStaticAssetsServer()
  const { circuit } = getTestFixture({
    platform: {
      resolveProjectStaticFileImportUrl: async () =>
        `${staticAssetsServerUrl}/missing.svg`,
    },
  })

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic
          imageUrl="/assets/missing.svg"
          svgContent={fallbackSvg}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_graphic.list()).toEqual([
    expect.objectContaining({
      asset: {
        project_relative_path: "/assets/missing.svg",
        url: `${staticAssetsServerUrl}/missing.svg`,
        mimetype: "image/svg+xml",
      },
      svg_content: fallbackSvg,
    }),
  ])
  expect(
    getEmbeddedSchematicGraphicSvgContent(
      convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
    ),
  ).toBe(fallbackSvg)
})
