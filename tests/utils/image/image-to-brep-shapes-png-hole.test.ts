import { expect, test } from "bun:test"
import { Resvg } from "@resvg/resvg-js"
import { imageToBrepShapes } from "lib/utils/image/silkscreen-graphics"

test("imageToBrepShapes preserves holes when converting a PNG into silkscreen breps", async () => {
  const svg = `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" fill="white" />
      <path
        d="M 2 2 H 18 V 18 H 2 Z M 6 6 H 14 V 14 H 6 Z"
        fill="black"
        fill-rule="evenodd"
      />
    </svg>
  `

  const pngBytes = new Resvg(svg, {
    fitTo: { mode: "width", value: 240 },
  })
    .render()
    .asPng()

  const shapes = await imageToBrepShapes({
    importedImageBytes: pngBytes.buffer,
    contentType: "image/png",
    sourceName: "ring.png",
    width: 20,
    height: 20,
  })

  expect(shapes).toHaveLength(1)
  expect(shapes[0]!.inner_rings).toHaveLength(1)
})
