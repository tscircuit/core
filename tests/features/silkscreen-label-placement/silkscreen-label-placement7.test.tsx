import { expect, test } from "bun:test"
import { getTextBounds } from "lib/utils/silkscreen-label-placement/label-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bottom-layer labels move off bottom-layer parts, not top-layer ones", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="6mm" routingDisabled>
      <pcbnotetext
        pcbY={-2.6}
        fontSize={0.4}
        text="Bottom R1's label leaves R2 and lands over top R3"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={0}
        pcbY={0.9}
      />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={0} pcbY={-1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Label = circuit.db.pcb_silkscreen_text
    .list()
    .find((text) => text.text === "R1")!
  // An 0402's default label is centered 1.22 mm above the part; R3's pads are
  // on the other side, so they don't keep R1's label from hugging R1 below
  expect(r1Label.layer).toBe("bottom")
  // Its text is centered under R1; the anchor of mirrored text is not
  const r1TextBounds = getTextBounds(r1Label)
  expect((r1TextBounds.minX + r1TextBounds.maxX) / 2).toBeCloseTo(0)
  expect(r1Label.anchor_position.y).toBeLessThan(-0.44)
  expect(r1Label.anchor_position.y).toBeGreaterThan(-1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
