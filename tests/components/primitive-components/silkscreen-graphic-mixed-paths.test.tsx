import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen SVG keeps open strokes beside filled contours", async () => {
  const { circuit } = getTestFixture()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path fill="black" d="M10 10H40V90H10Z"/>
    <path fill="none" stroke="black" d="M60 20L90 80"/>
  </svg>`
  circuit.add(
    <board width="50mm" height="50mm">
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(svg)}`}
        width="40mm"
        height="40mm"
      />
      <silkscreentext
        text="filled contour / open stroke"
        pcbY={21}
        fontSize="1mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_graphic.list()).toHaveLength(1)
  const [path] = circuit.db.pcb_silkscreen_path.list()
  expect(circuit.db.pcb_silkscreen_path.list()).toHaveLength(1)
  expect(path.route).toEqual([
    { x: 4, y: 12 },
    { x: 16, y: -12 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
