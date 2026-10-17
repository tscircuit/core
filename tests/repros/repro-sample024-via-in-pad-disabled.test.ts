import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import boardData from "tests/fixtures/assets/sample024-board-via-policy.json"

test("an imported board explicitly disables via-in-pad", async () => {
  const board = pcb_board.parse({
    ...boardData,
    is_via_in_pad_allowed: false,
  })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [board],
    ignoreExistingTopLevelPcbRouteState: true,
  })

  expect(simpleRouteJson.allowViaInPad).toBeUndefined()

  const snapshot = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="180" viewBox="0 0 640 180">
    <rect width="640" height="180" fill="#111827" />
    <g font-family="Arial, sans-serif" fill="#e5e7eb">
      <text x="28" y="38" font-size="23" font-weight="bold">Via-in-pad: explicitly disabled</text>
      <text x="28" y="88" font-size="18">Circuit JSON is_via_in_pad_allowed</text>
      <text x="500" y="88" font-size="18">${board.is_via_in_pad_allowed}</text>
      <text x="28" y="138" font-size="18">SRJ allowViaInPad</text>
      <text x="500" y="138" font-size="18" fill="${simpleRouteJson.allowViaInPad === undefined ? "#fbbf24" : "#34d399"}">${simpleRouteJson.allowViaInPad ?? "not emitted"}</text>
    </g>
  </svg>`
  await expect(snapshot).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0.01,
  })
})
