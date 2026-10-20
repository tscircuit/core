import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import boardData from "tests/fixtures/assets/sample024-board-via-policy.json"

test("an imported board omits its via-in-pad policy", () => {
  const board = pcb_board.parse(boardData)
  delete board.is_via_in_pad_allowed
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [board],
    ignoreExistingTopLevelPcbRouteState: true,
  })

  expect(simpleRouteJson.allowViaInPad).toBe(false)
})
