import { expect, test } from "bun:test"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"
import {
  doBoundsShareArea,
  getTextBounds,
} from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels move out from under a mounted board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm" routingDisabled>
      <pcbnotetext
        pcbY={4.4}
        fontSize={0.4}
        text="R1's default label falls under M1, which hides it: it moves"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={-3} />
      <mountedboard name="M1" width={8} height={4} pcbX={0} pcbY={0}>
        <resistor name="R2" resistance="1k" footprint="0402" />
      </mountedboard>
    </board>,
  )
  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  const mountedBoardBounds = getBoundFromCenteredRect({
    center: { x: 0, y: 0 },
    width: 8,
    height: 4,
  })
  expect(doBoundsShareArea(getTextBounds(r1Label), mountedBoardBounds)).toBe(
    false,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
