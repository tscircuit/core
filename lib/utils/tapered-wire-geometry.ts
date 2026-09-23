import { Polygon } from "@flatten-js/core"
import { getTaperedTraceGeometry } from "@tscircuit/copper-pour-solver"
import type { PcbTraceRoutePointWire, Point } from "circuit-json"
import type { Obstacle } from "./obstacles/types"

/** Points in the input's right-handed PCB frame (+X right, +Y up), mm.
 * Use the same bounded-error outline for clearance, bounds and connectivity
 * as the copper-pour solver. Coordinates may be local or board-world.
 */
export const getTaperedWireGeometry = (
  start: PcbTraceRoutePointWire,
  end: Point,
) => {
  const geometry = getTaperedTraceGeometry({
    start,
    end,
    start_width: start.start_width ?? start.width,
    end_width: start.end_width ?? start.width,
    width_interpolation_mode: start.width_interpolation_mode ?? "linear",
  })
  return {
    ...geometry,
    polygon: new Polygon(geometry.outline.map((p) => [p.x, p.y])),
  }
}

/** Conservative rectangular routing clearance in board-world mm (+X right,
 * +Y up, right-handed). Boxes enclose the actual taper, including curved sides.
 */
export const getTaperedWireObstacles = (
  start: PcbTraceRoutePointWire,
  end: Point,
  connectedTo: string[],
): Obstacle[] => {
  if (start.x === end.x && start.y === end.y) {
    return [
      {
        type: "rect",
        layers: [start.layer],
        connectedTo,
        center: { x: start.x, y: start.y },
        width: start.width,
        height: start.width,
      },
    ]
  }
  const { bounds } = getTaperedWireGeometry(start, end)
  if (!start.width_interpolation_mode) {
    bounds.left = Math.min(
      bounds.left,
      start.x - start.width / 2,
      end.x - start.width / 2,
    )
    bounds.right = Math.max(
      bounds.right,
      start.x + start.width / 2,
      end.x + start.width / 2,
    )
    bounds.bottom = Math.min(
      bounds.bottom,
      start.y - start.width / 2,
      end.y - start.width / 2,
    )
    bounds.top = Math.max(
      bounds.top,
      start.y + start.width / 2,
      end.y + start.width / 2,
    )
  }
  return [
    {
      type: "rect",
      layers: [start.layer],
      connectedTo,
      center: {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.bottom + bounds.top) / 2,
      },
      width: bounds.right - bounds.left,
      height: bounds.top - bounds.bottom,
    },
  ]
}
