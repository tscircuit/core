import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("trace obstacles enclose wire widths and caps in either axis and direction", () => {
  // Board-world points in mm: +X right, +Y up, right-handed.
  for (const layer of ["top", "bottom"] as const) {
    for (const width of [0.05, 0.5, 1.2]) {
      for (const end of [
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ]) {
        for (const reverse of [false, true]) {
          const points = [{ x: 0, y: 0 }, end]
          if (reverse) points.reverse()
          const trace: PcbTrace = {
            type: "pcb_trace",
            pcb_trace_id: "pcb_trace_coil",
            source_trace_id: "source_trace_coil",
            route: points.map((point) => ({
              ...point,
              route_type: "wire",
              width,
              layer,
            })),
          }
          const [obstacle] = getObstaclesFromCircuitJson([trace])
          expect(obstacle).toMatchObject({
            center: { x: end.x / 2, y: end.y / 2 },
            width: end.x + width,
            height: end.y + width,
            layers: [layer],
            connectedTo: ["source_trace_coil"],
          })
        }
      }
    }
  }
})
