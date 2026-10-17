import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint constraint yDist with edgeToEdge separates top bottom-edge and bottom top-edge by yDist", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width="2mm"
              height="2mm"
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width="2mm"
              height="4mm"
            />
            <constraint pcb edgeToEdge yDist="1mm" top=".pin1" bottom=".pin2" />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(2)

  const rectPads = pads.filter(
    (p): p is Extract<(typeof pads)[number], { shape: "rect" }> =>
      p.shape === "rect",
  )
  const topPad = rectPads.find((p) => Math.abs(p.height - 2) < 1e-6)!
  const bottomPad = rectPads.find((p) => Math.abs(p.height - 4) < 1e-6)!

  expect(topPad).toBeDefined()
  expect(bottomPad).toBeDefined()

  // Center separation should be 1mm gap + 1mm top half-height + 2mm bottom half-height = 4mm
  expect(topPad.y - bottomPad.y).toBeCloseTo(4, 5)

  const topBottomEdge = topPad.y - topPad.height / 2
  const bottomTopEdge = bottomPad.y + bottomPad.height / 2
  expect(topBottomEdge - bottomTopEdge).toBeCloseTo(1, 5)
})
