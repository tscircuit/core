import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import boardData from "tests/fixtures/assets/sample024-board-via-policy.json"

test("an imported board explicitly disables via-in-pad", () => {
  const board = pcb_board.parse({
    ...boardData,
    is_via_in_pad_allowed: false,
  })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [board],
    ignoreExistingTopLevelPcbRouteState: true,
  })

  expect(simpleRouteJson.allowViaInPad).toBeUndefined()
})
