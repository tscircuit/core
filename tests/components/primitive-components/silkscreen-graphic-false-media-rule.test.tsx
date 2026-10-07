import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenGraphic ignores rules in false media scopes", async () => {
  const { circuit } = getTestFixture()
  const falseMediaRuleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <style>
        @media not all {
          path { fill: none; stroke: none; }
        }
      </style>
      <path d="M 1 5 L 9 5" fill="none" stroke="black" />
    </svg>
  `

  circuit.add(
    <board width="12mm" height="5mm">
      <pcbnotetext
        pcbY={1.25}
        fontSize={0.4}
        text="FALSE MEDIA RULE CANNOT HIDE THIS LINE"
      />
      <silkscreengraphic
        imageUrl={`data:image/svg+xml,${encodeURIComponent(falseMediaRuleSvg)}`}
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
