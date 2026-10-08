import { expect, test } from "bun:test"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels of a cached subcircuit are placed with the board's", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={2.6}
        fontSize={0.4}
        text="S1 renders apart and is cached: R1's label still moves off the hole"
      />
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
        {/* An 0402's default label is centered 1.22 mm above the part */}
        <hole pcbY={1.22} diameter="0.4mm" />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  const holeBounds = getBoundFromCenteredRect({
    center: { x: 0, y: 1.22 },
    width: 0.4,
    height: 0.4,
  })
  expect(doBoundsShareArea(getTextBounds(r1Label), holeBounds)).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
