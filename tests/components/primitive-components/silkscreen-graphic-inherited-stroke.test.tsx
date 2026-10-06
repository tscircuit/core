import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic preserves inherited open and closed strokes", async () => {
  const { circuit } = getTestFixture()
  const inheritedStrokeSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <g fill="none" stroke="black">
        <path d="M 1 2 L 9 2" />
        <path d="M 2 4 L 8 4 L 8 9 L 2 9 Z" />
      </g>
    </svg>
  `

  circuit.add(
    <board width="12mm" height="10mm">
      <pcbnotetext
        pcbY={3.75}
        fontSize={0.4}
        text="INHERITED OPEN + CLOSED STROKES"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(inheritedStrokeSvg)}`}
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
