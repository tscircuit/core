import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen rectangle stroke modes preserve fill and layer", () => {
  const { circuit } = getTestFixture()
  const strokes = ["none", "solid", "dashed", undefined] as const
  circuit.add(
    <board width={45} height={20}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        strokes.map((stroke, i) => (
          <>
            <silkscreenrect
              pcbX={-15 + i * 10}
              pcbY={row ? -4 : 4}
              width={6}
              height={3}
              strokeWidth={0.3}
              filled={false}
              stroke={stroke}
              layer={layer}
            />
            <silkscreentext
              pcbX={-15 + i * 10}
              pcbY={row ? -7 : 1}
              text={`${layer} ${stroke ?? "default"}`}
              fontSize={0.6}
            />
          </>
        )),
      )}
    </board>,
  )
  circuit.render()
  for (const [i, rect] of circuit.db.pcb_silkscreen_rect.list().entries()) {
    const stroke = strokes[i % strokes.length]
    expect(rect.has_stroke).toBe(
      stroke === undefined ? undefined : stroke !== "none",
    )
    expect(rect.is_stroke_dashed).toBe(
      stroke === undefined ? undefined : stroke === "dashed",
    )
    expect(rect.is_filled).toBe(false)
    expect(rect.stroke_width).toBe(0.3)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
