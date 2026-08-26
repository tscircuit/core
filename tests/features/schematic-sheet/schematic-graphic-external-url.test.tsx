import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestStaticAssetsServer } from "tests/fixtures/get-test-static-assets-server"

test("schematic graphic resolves a project SVG path through the platform", async () => {
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
        <schematicgraphic imageUrl={imageUrl} />
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

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
