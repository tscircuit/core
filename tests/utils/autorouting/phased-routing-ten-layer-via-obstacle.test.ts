import { expect, test } from "bun:test"
import { Group_getObstaclesFromRoutedTraces } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

test("phased autorouting blocks every layer crossed by a through via", () => {
  const trace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_0",
    route: [
      {
        route_type: "via",
        x: 1,
        y: 2,
        from_layer: "inner1",
        to_layer: "inner8",
      },
    ],
  }

  const [viaObstacle] = Group_getObstaclesFromRoutedTraces([trace], 10)

  expect(viaObstacle.layers).toEqual([
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
    "bottom",
  ])
})
