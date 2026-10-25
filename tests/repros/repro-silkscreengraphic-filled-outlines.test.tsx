import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("filled silkscreen SVG gains outlines that cover a 0.4mm slot", async () => {
  const { circuit } = getTestFixture()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path fill="black" fill-rule="evenodd" d="M10 10H90V90H10Z M49.5 20H50.5V80H49.5Z"/>
  </svg>`

  circuit.add(
    <board width="50mm" height="50mm">
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(svg)}`}
        width="40mm"
        height="40mm"
        layer="top"
      />
      <silkscreentext
        text="0.4mm slot should stay open"
        pcbY={21}
        fontSize="1mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [graphic] = circuit.db.pcb_silkscreen_graphic.list()
  expect(graphic.brep_shape.inner_rings).toHaveLength(1)
  const slotXs = graphic.brep_shape.inner_rings[0].vertices.map(({ x }) => x)
  expect(Math.max(...slotXs) - Math.min(...slotXs)).toBeCloseTo(0.4)

  // The BRep retains the slot, but these additional strokes cover it.
  const paths = circuit.db.pcb_silkscreen_path.list()
  expect(paths).toHaveLength(2)
  expect(paths[0].stroke_width).toBeGreaterThan(0.4)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
