import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import boardData from "tests/fixtures/assets/sample024-board-via-policy.json"

test("Sample024 via-in-pad policy at the Circuit JSON to SRJ boundary", async () => {
  // Unmodified pcb_board from dataset-srj24@004847d1,
  // circuit-json/sample024-pmp22650-main.json. The false and unspecified
  // variants below are controls; the imported PMP22650 board allows via-in-pad.
  const importedBoard = pcb_board.parse(boardData)
  expect(importedBoard.is_via_in_pad_allowed).toBe(true)

  const policies = [
    { label: "PMP22650", value: importedBoard.is_via_in_pad_allowed },
    { label: "Explicit false", value: false },
    { label: "Unspecified", value: undefined },
  ]
  const results = policies.map(({ label, value }) => {
    const board = { ...importedBoard, is_via_in_pad_allowed: value }
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: [board],
      ignoreExistingTopLevelPcbRouteState: true,
    })
    return {
      label,
      sourcePolicy: value,
      srjPolicy: simpleRouteJson.allowViaInPad,
    }
  })

  expect(results.map(({ srjPolicy }) => srjPolicy)).toEqual([
    undefined,
    undefined,
    undefined,
  ])

  const snapshot = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="330" viewBox="0 0 900 330">
    <rect width="900" height="330" fill="#111827" />
    <g font-family="Arial, sans-serif" fill="#e5e7eb">
      <text x="28" y="38" font-size="23" font-weight="bold">PMP22650: via-in-pad policy conversion</text>
      <text x="28" y="68" font-size="15">The imported board allows vias in pads. Missing SRJ policy defaults to false.</text>
      <g font-size="16" fill="#9ca3af">
        <text x="28" y="110">Case</text>
        <text x="240" y="110">Source policy</text>
        <text x="430" y="110">SRJ allowViaInPad</text>
        <text x="680" y="110">Router flag (?? false)</text>
      </g>
      ${results
        .map(
          ({ label, sourcePolicy, srjPolicy }, index) => `
        <line x1="28" y1="${126 + index * 55}" x2="872" y2="${126 + index * 55}" stroke="#374151" />
        <g font-size="18">
          <text x="28" y="${159 + index * 55}">${label}</text>
          <text x="240" y="${159 + index * 55}">${sourcePolicy ?? "unspecified"}</text>
          <text x="430" y="${159 + index * 55}" fill="${srjPolicy === undefined ? "#fbbf24" : "#34d399"}">${srjPolicy ?? "not emitted"}</text>
          <text x="680" y="${159 + index * 55}">${srjPolicy ?? false}</text>
        </g>`,
        )
        .join("")}
      <text x="28" y="310" font-size="14" fill="#9ca3af">Source: dataset-srj24 / sample024 / pcb_board</text>
    </g>
  </svg>`

  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
})
