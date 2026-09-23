import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePointTeardrop } from "circuit-json"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { getPreservedRoutedSubcircuitTraces } from "lib/utils/autorouting/getPreservedRoutedSubcircuitTraces"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import {
  getRoutePointPosition,
  getRoutePointPositions,
} from "lib/utils/pcb-trace-route-point-utils"

test("unsupported teardrop copper fails explicitly instead of producing invalid geometry", () => {
  const teardrop: PcbTraceRoutePointTeardrop = {
    route_type: "teardrop",
    start: { x: 1, y: 2 },
    end: { x: 3, y: 4 },
    start_width: 0.6,
    end_width: 0.2,
    width_interpolation_mode: "smoothstep",
    layer: "top",
  }
  const db = su([])
  db.pcb_trace.insert({ route: [teardrop], subcircuit_id: "subcircuit_0" })
  const message = "Teardrop PCB trace routes are not yet supported by core"
  expect(() => new PcbTrace({ route: [teardrop] }).getPcbSize()).toThrow(
    message,
  )
  expect(() => getObstaclesFromCircuitJson(db.toArray())).toThrow(message)
  expect(() =>
    getPreservedRoutedSubcircuitTraces({
      scopedDb: db,
      relevantSubcircuitIds: null,
    }),
  ).toThrow(message)
  expect(() => reversePcbTraceRoute([teardrop])).toThrow(message)
  expect(getRoutePointPosition(teardrop)).toEqual({ x: 1, y: 2 })
  expect(getRoutePointPositions(teardrop)).toEqual([
    { x: 1, y: 2 },
    { x: 3, y: 4 },
  ])
})
