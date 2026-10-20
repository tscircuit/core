import { expect, test } from "bun:test"
import { renderRepeatedPinLabelRoute } from "tests/fixtures/render-repeated-pin-label-route"

test("saved route selects and replays GND pin 2", async () => {
  const replay = await renderRepeatedPinLabelRoute({
    routedPinNumber: 2,
    expectedSelector: ".J1 > port.pin2",
  })
  await expect(replay).toMatchPcbSnapshot(import.meta.path)
})
