import { expect, test } from "bun:test"
import { expandSrjBoundsToIncludeConnectionPoints } from "lib/utils/autorouting/expand-srj-bounds-to-include-connection-points"

test("expands SRJ bounds around non-off-board connection points", () => {
  expect(
    expandSrjBoundsToIncludeConnectionPoints({
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
  ).toEqual({ minX: -2.25, maxX: 1, minY: -1, maxY: 1.5 })
})
