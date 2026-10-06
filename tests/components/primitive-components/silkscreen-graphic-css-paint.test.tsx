import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic resolves CSS and later inline paint", async () => {
  const { circuit } = getTestFixture()
  const cssPaintSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <style>.outline { fill: none; stroke: black; }</style>
      <path class="outline" d="M 1 1 L 9 1" />
      <path class="outline" d="M 2 3 L 8 3 L 8 7 L 2 7 Z" />
      <path style="fill:none;stroke:none;stroke:black" d="M 1 9 L 9 9" />
    </svg>
  `

  circuit.add(
    <board width="12mm" height="10mm">
      <pcbnotetext
        pcbY={3.75}
        fontSize={0.4}
        text="CSS OPEN + HOLLOW CLOSED + LATER STROKE"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(cssPaintSvg)}`}
        pcbY={-0.75}
        width="10mm"
        height="7mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_graphic.list()).toEqual([])
  expect(circuit.db.pcb_silkscreen_path.list()).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
