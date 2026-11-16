import { beforeAll, expect, test } from "bun:test"
import { renderBoardWidthSrjRoundTrip } from "tests/fixtures/render-board-width-srj-roundtrip"

let defaultConnectionWidth: number

beforeAll(async () => {
  const { widths } = await renderBoardWidthSrjRoundTrip()
  defaultConnectionWidth = widths.defaultConnectionWidth
})

test.failing("SRJ round trip uses the board default width", () => {
  expect(defaultConnectionWidth).toBe(0.35)
})
