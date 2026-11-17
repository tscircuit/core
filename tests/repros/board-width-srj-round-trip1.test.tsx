import { beforeAll, expect, test } from "bun:test"
import { renderBoardWidthSrjRoundTrip } from "tests/fixtures/render-board-width-srj-round-trip"

let defaultConnectionWidth: number

beforeAll(async () => {
  const { defaultConnection } = await renderBoardWidthSrjRoundTrip()
  defaultConnectionWidth = defaultConnection.nominalTraceWidth
})

test("SRJ round trip uses the board default width", () => {
  expect(defaultConnectionWidth).toBe(0.35)
})
