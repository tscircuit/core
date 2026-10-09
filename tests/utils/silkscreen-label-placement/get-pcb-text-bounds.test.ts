import { expect, test } from "bun:test"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"

test("text bounds cover the glyph strokes, and knockout text its padded fill", () => {
  // At 1 mm, glyphs advance 0.692 mm in 0.7 mm tall boxes and are drawn with
  // 0.09 mm strokes, from "C"'s left edge (0.051 mm into its box) to "1"'s
  // right edge (0.267 mm into the last box), and from 0.027 mm above the
  // bottom of the boxes to 0.519 mm above it. Centered text has its boxes
  // centered on the anchor, so the strokes sit left of and below it.
  const bounds = getPcbTextBounds({
    text: "C21",
    font_size: 1,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
  })
  expect(bounds.x).toBeCloseTo(-1.032)
  expect(bounds.x + bounds.width).toBeCloseTo(0.658)
  expect(bounds.y).toBeCloseTo(-0.368)
  expect(bounds.y + bounds.height).toBeCloseTo(0.214)

  // circuit-to-svg lays knockout text out apart, pads it by half a font size
  // left and right and 0.3 of one above and below, and centers the fill
  const knockoutBounds = getPcbTextBounds({
    text: "R12",
    font_size: 1,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
    is_knockout: true,
  })
  expect(knockoutBounds.x).toBeCloseTo(-1.481)
  expect(knockoutBounds.y).toBeCloseTo(-0.667)
  expect(knockoutBounds.width).toBeCloseTo(2.962)
  expect(knockoutBounds.height).toBeCloseTo(1.334)

  // The fill of every line is aligned on the anchor as a whole
  const paddedBounds = getPcbTextBounds({
    text: "AB\nC",
    font_size: 0.8,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "bottom_right",
    is_knockout: true,
    knockout_padding: { left: 0.2, right: 0.4, top: 0.1, bottom: 0.3 },
  })
  expect(paddedBounds.x).toBeCloseTo(-1.642)
  expect(paddedBounds.y).toBeCloseTo(0)
  expect(paddedBounds.width).toBeCloseTo(1.642)
  expect(paddedBounds.height).toBeCloseTo(1.867)
})
