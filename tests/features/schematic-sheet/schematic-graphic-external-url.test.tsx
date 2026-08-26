import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic graphic materializes an external SVG URL fallback", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })
  const imageUrl = `${staticAssetsServerUrl}/schematic-graphic.svg`

  circuit.add(
    <board routingDisabled>
      <schematicsheet>
        <schematicgraphic imageUrl={imageUrl} />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const [schematicGraphic] = circuit.db.schematic_graphic.list()
  expect(schematicGraphic).toEqual(
    expect.objectContaining({
      type: "schematic_graphic",
      asset: {
        project_relative_path: imageUrl,
        url: imageUrl,
        mimetype: "image/svg+xml",
      },
      svg_content: expect.stringContaining("<svg"),
    }),
  )

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
