import { expect, test } from "bun:test"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("breakout points expand resolved fanout bounds", () => {
  const fanoutBounds = FanoutAutorouter.resolveFanoutBounds(
    {} as SimpleRouteJson,
    {
      mode: "fanout",
      fanoutBounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
      breakoutPoints: [
        { x: -1.5, y: 0 },
        { x: 0, y: 1.75 },
      ],
    },
  )

  expect(fanoutBounds).toEqual({
    minX: -1.5,
    maxX: 1,
    minY: -1,
    maxY: 1.75,
  })
})
