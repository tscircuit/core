import { expect, test } from "bun:test"
import { Resvg } from "@resvg/resvg-js"
import { pcb_silkscreen_graphic } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("transparent PNG silkscreen preserves the target artwork", async () => {
  const targetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <path fill="black" d="M10 10H35V16H16V35H10Z M65 10H90V35H84V16H65Z M10 65H16V84H35V90H10Z M84 65H90V90H65V84H84Z M47 28H53V47H72V53H53V72H47V53H28V47H47Z" />
  </svg>`
  const targetPng = new Resvg(targetSvg).render().asPng()
  const svgImageUrl = `data:image/svg+xml,${encodeURIComponent(targetSvg)}`
  const pngImageUrl = `data:image/png;base64,${targetPng.toString("base64")}`
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="26mm" height="15mm">
      <silkscreentext text="SVG" pcbX={-6} pcbY={5} fontSize={1.2} />
      <silkscreentext text="PNG" pcbX={6} pcbY={5} fontSize={1.2} />
      <silkscreengraphic
        imageUrl={svgImageUrl}
        width="6mm"
        height="6mm"
        pcbX={-6}
        pcbY={0}
      />
      <silkscreengraphic
        imageUrl={pngImageUrl}
        width="6mm"
        height="6mm"
        pcbX={6}
        pcbY={0}
      />
      <silkscreentext text="SAME ARTWORK" pcbX={0} pcbY={-5} fontSize={1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const graphics = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_silkscreen_graphic")
    .map((graphic) => pcb_silkscreen_graphic.parse(graphic))
  const svgGraphics = graphics.filter(
    (graphic) => graphic.image_asset?.mimetype === "image/svg+xml",
  )
  const pngGraphics = graphics.filter(
    (graphic) => graphic.image_asset?.mimetype === "image/png",
  )

  expect(svgGraphics).toHaveLength(5)
  expect(pngGraphics).toHaveLength(11)
  expect(
    pngGraphics.every((graphic) => graphic.image_asset?.url === pngImageUrl),
  ).toBe(true)
  const inkArea = pngGraphics.reduce((area, graphic) => {
    const vertices = graphic.brep_shape.outer_ring.vertices
    const xs = vertices.map((point) => point.x)
    const ys = vertices.map((point) => point.y)
    return (
      area +
      (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    )
  }, 0)
  // The 100 × 100 artwork has 1548 dark pixels, scaled to a 6 × 6 mm graphic.
  expect(inkArea).toBeCloseTo((1548 / 10000) * 36, 6)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
