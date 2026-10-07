import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic gives attribute selectors class specificity", async () => {
  const { circuit } = getTestFixture()
  const cssSpecificitySvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <style>
        [id="line"] { stroke: none; }
        .outline.visible { stroke: black; }
      </style>
      <path id="line" class="outline visible" d="M 1 5 L 9 5" />
    </svg>
  `

  circuit.add(
    <board width="12mm" height="5mm">
      <pcbnotetext
        pcbY={1.25}
        fontSize={0.4}
        text="TWO CLASSES OVERRIDE [id]"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(cssSpecificitySvg)}`}
        pcbY={-0.5}
        width="10mm"
        height="2mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_graphic.list()).toEqual([])
  expect(circuit.db.pcb_silkscreen_path.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
