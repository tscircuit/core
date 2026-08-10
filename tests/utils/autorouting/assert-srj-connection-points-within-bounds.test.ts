import { expect, test } from "bun:test"
import { assertSrjConnectionPointsWithinBounds } from "lib/utils/autorouting/assert-srj-connection-points-within-bounds"

test("reports non-off-board connection points outside SRJ bounds", () => {
  expect(() =>
    assertSrjConnectionPointsWithinBounds({
      bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
      connections: [
        {
          name: "DISPLAY_DATA",
          pointsToConnect: [
            { x: 0, y: 0, layer: "top", port_selector: "U1.GPIO1" },
            { x: -2.25, y: 0, layer: "top", pcb_port_id: "pcb_port_1" },
            { x: 0, y: 1.5, layer: "top", pointId: "breakout_point_1" },
          ],
        },
        {
          name: "OFF_BOARD",
          isOffBoard: true,
          pointsToConnect: [
            { x: 5, y: 5, layer: "top", port_selector: "J1.pin1" },
          ],
        },
      ],
    }),
  ).toThrow(
    "SimpleRouteJson bounds exclude 2 pointsToConnect across 1 non-off-board connection. Bounds are x=-1mm..1mm, y=-1mm..1mm. Outside points: DISPLAY_DATA (pcb_port_1) at (-2.25mm, 0mm), 1.25mm outside; DISPLAY_DATA (breakout_point_1) at (0mm, 1.5mm), 0.5mm outside. Expand the routing bounds to contain every routable point, or set connection.isOffBoard=true when its points are intentionally external.",
  )
})
