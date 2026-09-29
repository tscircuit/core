import type { LayerRef, PcbTrace, PcbTraceRoutePointWire } from "circuit-json"

/** Copper contact in board-world mm: +X right, +Y up, +Z above (right-handed).
 * The center is a point; diameter describes an inscribed copper circle.
 */
export interface TraceTeardropContact {
  x: number
  y: number
  layer: LayerRef
  diameter: number
}

/** Post-process completed wire segments without moving their centerline.
 * Positions use the same board-world frame as TraceTeardropContact. Existing
 * explicit tapers are preserved. New tapers stop before the next bend and
 * leave a straight section between two contacts on the same segment.
 */
export function addTraceTeardrops(
  route: PcbTrace["route"],
  contacts: readonly TraceTeardropContact[],
): PcbTrace["route"] {
  const result: PcbTrace["route"] = []
  const contactDiameter = (point: PcbTraceRoutePointWire) => {
    let diameter = 0
    for (const contact of contacts) {
      if (
        contact.layer === point.layer &&
        Math.hypot(contact.x - point.x, contact.y - point.y) < 1e-6
      )
        diameter = Math.max(diameter, contact.diameter)
    }
    return diameter
  }
  for (let index = 0; index < route.length; index++) {
    const start = route[index]
    const end = route[index + 1]
    if (
      start.route_type !== "wire" ||
      end?.route_type !== "wire" ||
      start.layer !== end.layer ||
      start.width_interpolation_mode
    ) {
      result.push(start)
      continue
    }
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    const startDiameter = contactDiameter(start)
    const endDiameter = contactDiameter(end)
    const size = (diameter: number) => {
      const width = diameter * 0.8
      const taperLength = Math.min(diameter * 1.5, length * 0.45)
      return width > start.width && taperLength > diameter / 2
        ? { width, length: taperLength }
        : undefined
    }
    const startTaper = size(startDiameter)
    const endTaper = size(endDiameter)
    if (!startTaper && !endTaper) {
      result.push(start)
      continue
    }
    const atDistance = (distance: number): PcbTraceRoutePointWire => ({
      route_type: "wire",
      x: start.x + ((end.x - start.x) * distance) / length,
      y: start.y + ((end.y - start.y) * distance) / length,
      width: start.width,
      layer: start.layer,
    })
    if (startTaper) {
      result.push({
        ...start,
        width: startTaper.width,
        start_width: startTaper.width,
        end_width: start.width,
        width_interpolation_mode: "quadratic",
      })
      result.push(atDistance(startTaper.length))
    } else result.push(start)
    if (endTaper) {
      result.push({
        ...atDistance(length - endTaper.length),
        start_width: start.width,
        end_width: endTaper.width,
        width_interpolation_mode: "quadratic",
      })
    }
  }
  return result
}
