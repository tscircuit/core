import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic resolves descendant and child selectors", async () => {
  const { circuit } = getTestFixture()
  const cssCombinatorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <style>
        .drawing path { fill: none; stroke: black; }
        .direct > path { fill: none; stroke: black; }
        path { fill: black; stroke: none; }
      </style>
      <g class="drawing"><g><path d="M 1 2 L 9 2" /></g></g>
      <g class="direct"><path d="M 2 4 L 8 4 L 8 9 L 2 9 Z" /></g>
    </svg>
  `

  circuit.add(
    <board width="12mm" height="10mm">
      <pcbnotetext
        pcbY={3.75}
        fontSize={0.4}
        text="DESCENDANT + CHILD SELECTORS: STROKES ONLY"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(cssCombinatorSvg)}`}
        pcbY={-0.75}
        width="10mm"
        height="7mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_graphic.list()).toEqual([])
  expect(circuit.db.pcb_silkscreen_path.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
