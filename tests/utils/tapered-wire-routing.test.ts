import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getPreservedRoutedSubcircuitTraces } from "lib/utils/autorouting/getPreservedRoutedSubcircuitTraces"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("preserved traces retain taper metadata and protect their wide end in routing and pours", () => {
  const route: PcbTraceRoutePoint[] = [
    {
      route_type: "wire",
      x: 0,
      y: 0,
      layer: "top",
      width: 0.2,
      start_width: 0.2,
      end_width: 2,
      width_interpolation_mode: "quadratic",
    },
    { route_type: "via", x: 4, y: 0, from_layer: "top", to_layer: "bottom" },
  ]
  const db = su([])
  db.pcb_trace.insert({ route, subcircuit_id: "subcircuit_1" })
  const preserved = getPreservedRoutedSubcircuitTraces({
    scopedDb: db,
    relevantSubcircuitIds: null,
  })
  expect(preserved[0]!.route[0]).toMatchObject(route[0]!)
  for (const obstacles of [getObstaclesFromCircuitJson(db.toArray())]) {
    expect(obstacles).toHaveLength(2)
    expect(obstacles[0]).toMatchObject({
      center: { x: 2, y: 0 },
      width: 4,
      height: 2,
      layers: ["top"],
    })
  }
})
