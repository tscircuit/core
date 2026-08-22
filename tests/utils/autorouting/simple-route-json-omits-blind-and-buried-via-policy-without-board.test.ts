import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("simple route json omits blind and buried via policy without a board", () => {
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: [],
  })

  expect(simpleRouteJson.allowBlindAndBuriedVias).toBeUndefined()
})
