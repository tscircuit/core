import { expect, test } from "bun:test"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"

test("knockout text covers its padded fill, aligned on the anchor as a whole", () => {
  const text = {
    text: "REV A",
    font_size: 1,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "top_left" as const,
  }
  // 5 characters, 0.6 font sizes wide each
  expect(getPcbTextBounds(text)).toEqual({ x: 0, y: -1, width: 3, height: 1 })

  // circuit-to-svg pads knockout text by half a font size left and right and
  // 0.3 of one above and below
  const knockoutBounds = getPcbTextBounds({ ...text, is_knockout: true })
  expect(knockoutBounds.x).toBeCloseTo(0)
  expect(knockoutBounds.y).toBeCloseTo(-1.6)
  expect(knockoutBounds.width).toBeCloseTo(4)
  expect(knockoutBounds.height).toBeCloseTo(1.6)

  const paddedBounds = getPcbTextBounds({
    ...text,
    anchor_alignment: "center",
    is_knockout: true,
    knockout_padding: { left: 0.2, right: 0.4, top: 0.1, bottom: 0.3 },
  })
  expect(paddedBounds.x).toBeCloseTo(-1.8)
  expect(paddedBounds.y).toBeCloseTo(-0.7)
  expect(paddedBounds.width).toBeCloseTo(3.6)
  expect(paddedBounds.height).toBeCloseTo(1.4)
})
