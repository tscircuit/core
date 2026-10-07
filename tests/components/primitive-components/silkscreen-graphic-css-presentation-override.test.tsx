import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic CSS overrides presentation attributes", async () => {
  const { circuit } = getTestFixture()
  const cssPresentationOverrideSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <style>
        .outline { fill: none; stroke: black; }
      </style>
      <path
        class="outline"
        fill="black"
        stroke="none"
        d="M 2 8 L 5 2 L 8 8 Z"
      />
    </svg>
  `

  circuit.add(
    <board width="12mm" height="6mm">
      <pcbnotetext
        pcbY={2}
        fontSize={0.4}
        text="CSS OVERRIDES FILL + STROKE ATTRIBUTES"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(cssPresentationOverrideSvg)}`}
        pcbY={-0.75}
        width="8mm"
        height="3mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_silkscreen_graphic.list()).toEqual([])
  expect(circuit.db.pcb_silkscreen_path.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
