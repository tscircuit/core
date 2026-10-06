import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic preserves an open stroked SVG path", async () => {
  const { circuit } = getTestFixture()
  const strokeSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <path d="M 1 5 L 9 5" fill="none" stroke="#fff" stroke-width="1" />
    </svg>
  `

  circuit.add(
    <board width="12mm" height="7mm">
      <pcbnotetext pcbY={2} fontSize={0.45} text="OPEN STROKE PRESERVED" />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(strokeSvg)}`}
        pcbY={-0.75}
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
