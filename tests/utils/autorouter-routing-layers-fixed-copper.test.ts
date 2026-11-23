import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getRoutingLayerError } from "lib/utils/autorouting/get-routing-layer-error"

test("accepts returned copper on a reserved layer and rejects added copper with the same trace id", () => {
  const fixedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "fixed",
    isFixed: true,
    route: [
      { route_type: "wire", x: 0, y: 0, layer: "inner1", width: 0.15 },
      { route_type: "wire", x: 1, y: 0, layer: "inner1", width: 0.15 },
    ],
  }
  const input = { routingLayers: ["top", "bottom"], traces: [fixedTrace] }
  const reversed = { ...fixedTrace, route: [...fixedTrace.route].reverse() }
  expect(getRoutingLayerError(input, [reversed])).toBeUndefined()
  reversed.route.push({
    route_type: "wire",
    x: -1,
    y: 0,
    layer: "inner1",
    width: 0.15,
  })
  expect(getRoutingLayerError(input, [reversed])).toContain(
    "routed copper on inner1",
  )
})
