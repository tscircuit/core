import { expect, test } from "bun:test"
import { pcb_silkscreen_graphic } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import thumbsUpSvg from "../../assets/thumbs-up.svg"

test("SilkscreenGraphic renders imported svg as circuit json graphic", async () => {
  const { circuit } = getTestFixture()
  const thumbsUpSvgText = await Bun.file(thumbsUpSvg).text()
  const thumbsUpSvgDataUrl = `data:image/svg+xml,${encodeURIComponent(
    thumbsUpSvgText,
  )}`

  circuit.add(
    <board width="10mm" height="10mm">
      <silkscreengraphic
        imageUrl={thumbsUpSvgDataUrl}
        pcbX={1}
        pcbY={-2}
        width="4mm"
        height="3mm"
        layer="top"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const graphics = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_silkscreen_graphic")

  expect(graphics.length).toBeGreaterThan(1)

  const parsedGraphics = graphics.map((graphic) =>
    pcb_silkscreen_graphic.parse(graphic),
  )
  expect(parsedGraphics.every((graphic) => graphic.layer === "top")).toBe(true)
  expect(parsedGraphics.every((graphic) => graphic.shape === "brep")).toBe(true)
  expect(
    parsedGraphics.every(
      (graphic) =>
        graphic.image_asset?.mimetype === "image/svg+xml" &&
        graphic.image_asset?.project_relative_path === "inline" &&
        graphic.image_asset?.url.startsWith("data:image/svg+xml,"),
    ),
  ).toBe(true)
  expect(
    parsedGraphics.some(
      (graphic) => graphic.brep_shape.outer_ring.vertices.length > 4,
    ),
  ).toBe(true)

  expect(circuit.db.pcb_silkscreen_path.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
