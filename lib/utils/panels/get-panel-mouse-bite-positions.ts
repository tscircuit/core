import * as Flatten from "@flatten-js/core"
import type { PcbCutoutPolygon, PcbCutoutRect, Point } from "circuit-json"
import { getPanelRoutingSlotPolygon } from "./get-panel-routing-slot-polygon"

/** Circuit-world geometry in mm, +X right/+Y up, right-handed +Z above.
 * boardEdge and bridgeOutline are positions; outwardNormal is a unit direction. */
export interface PanelTabMouseBite {
  boardEdge: Point
  outwardNormal: Flatten.Vector
  bridgeOutline: Point[]
}

/** Distances in mm along a tab's outward ray, starting at its board edge. */
interface RoutingInterval {
  start: number
  end: number
}

type PanelMouseBitePositionKey = `${number},${number}`
const POSITION_TOLERANCE_MM = 1e-6

/** Intersect a routing band with a circuit-world ray (+X right/+Y up,
 * right-handed +Z above). boardEdge is a position; outwardNormal a direction. */
function getRoutingIntervals({
  routingPolygon,
  boardEdge,
  outwardNormal,
}: {
  routingPolygon: Flatten.Polygon
  boardEdge: Point
  outwardNormal: Flatten.Vector
}): RoutingInterval[] {
  const origin = Flatten.point(boardEdge.x, boardEdge.y)
  const rayLine = Flatten.line(origin, origin.translate(outwardNormal))
  const distances = routingPolygon
    .intersect(rayLine)
    .map((position) => Flatten.vector(origin, position).dot(outwardNormal))
    .sort((a, b) => a - b)
  const intervals: RoutingInterval[] = []
  for (
    let boundaryIndex = 0;
    boundaryIndex < distances.length - 1;
    boundaryIndex++
  ) {
    const start = Math.max(0, distances[boundaryIndex]!)
    const end = distances[boundaryIndex + 1]!
    if (end - start <= POSITION_TOLERANCE_MM) continue
    const midpoint = origin.translate(outwardNormal.multiply((start + end) / 2))
    if (routingPolygon.contains(midpoint)) intervals.push({ start, end })
  }
  return intervals
}

/** End of the connected interval beginning at the board edge, in mm. */
function getConnectedIntervalEnd(intervals: RoutingInterval[]): number {
  const orderedIntervals = intervals.toSorted((a, b) => a.start - b.start)
  let end = 0
  for (const interval of orderedIntervals) {
    if (interval.start > end + POSITION_TOLERANCE_MM) break
    end = Math.max(end, interval.end)
  }
  return end
}

/** Put drills at both roots of each tab in circuit-world mm (+X right/+Y up,
 * right-handed +Z above). Returned points are positions. Unbroken outline
 * routing bands locate the frame edge or adjacent board across the channel.
 * Intersect that span with the preserved tab so junctions cannot send drills
 * past the tab's far edge into a different routing corridor. */
export function getPanelMouseBitePositions({
  mouseBites,
  routingCutouts,
  minimumDrillPitch,
}: {
  mouseBites: PanelTabMouseBite[]
  routingCutouts: (PcbCutoutRect | PcbCutoutPolygon)[]
  minimumDrillPitch: number
}): Point[] {
  if (mouseBites.length === 0) return []
  const routingPolygons = routingCutouts.map(getPanelRoutingSlotPolygon)
  const drillPositions = new Map<PanelMouseBitePositionKey, Point>()
  // Preserve the original board-edge rows before adding counterpart drills.
  for (const { boardEdge } of mouseBites) {
    const positionKey: PanelMouseBitePositionKey = `${Math.round(boardEdge.x / POSITION_TOLERANCE_MM)},${Math.round(boardEdge.y / POSITION_TOLERANCE_MM)}`
    if (!drillPositions.has(positionKey))
      drillPositions.set(positionKey, boardEdge)
  }
  for (const { boardEdge, outwardNormal, bridgeOutline } of mouseBites) {
    const channelEnd = getConnectedIntervalEnd(
      routingPolygons.flatMap((routingPolygon) =>
        getRoutingIntervals({ routingPolygon, boardEdge, outwardNormal }),
      ),
    )
    const bridgeEnd = getConnectedIntervalEnd(
      getRoutingIntervals({
        routingPolygon: new Flatten.Polygon(
          bridgeOutline.map(({ x, y }) => Flatten.point(x, y)),
        ),
        boardEdge,
        outwardNormal,
      }),
    )
    const oppositeEdgeDistance = Math.min(channelEnd, bridgeEnd)
    if (oppositeEdgeDistance <= POSITION_TOLERANCE_MM) {
      throw new Error("Could not locate the routed channel beside a panel tab")
    }
    const oppositeEdge = Flatten.point(boardEdge.x, boardEdge.y).translate(
      outwardNormal.multiply(oppositeEdgeDistance),
    )
    // A neighboring row can already perforate this portion of the tab.
    // Reuse those drills instead of adding overlapping or under-spaced holes.
    const positionKey: PanelMouseBitePositionKey = `${Math.round(oppositeEdge.x / POSITION_TOLERANCE_MM)},${Math.round(oppositeEdge.y / POSITION_TOLERANCE_MM)}`
    if (drillPositions.has(positionKey)) continue
    const alreadyPerforated = [...drillPositions.values()].some(
      (position) =>
        Math.hypot(position.x - oppositeEdge.x, position.y - oppositeEdge.y) <
        minimumDrillPitch - POSITION_TOLERANCE_MM,
    )
    if (!alreadyPerforated)
      drillPositions.set(positionKey, { x: oppositeEdge.x, y: oppositeEdge.y })
  }
  return [...drillPositions.values()]
}
