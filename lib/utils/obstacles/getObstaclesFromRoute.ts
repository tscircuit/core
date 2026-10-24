import type { LayerRef, PcbTraceRoutePoint } from "circuit-json"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import { getAxisAlignedRectFromRotatedRect } from "./getAxisAlignedRectFromRotatedRect"
import type { Obstacle } from "./types"

/** Board-world point in mm (+X right, +Y top) on one copper layer, with the
 * copper width in mm of the wire at that point. */
interface WirePoint {
  x: number
  y: number
  layer: LayerRef
  width: number
}

const DEFAULT_TRACE_WIDTH = 0.1
const DEFAULT_VIA_DIAMETER = 0.5

const getPositiveSize = (size: unknown, fallback: number) =>
  typeof size === "number" && Number.isFinite(size) && size > 0
    ? size
    : fallback

/**
 * Rect covering the copper of one straight wire segment in the board-world
 * frame (mm): the segment swept by a disc of `width`, so the rect extends half
 * the width past each end to cover the round caps. A zero-length segment is a
 * `width` square. Axis-aligned segments stay unrotated; others carry
 * `ccwRotationDegrees` about the rect center.
 */
const getWireSegmentObstacle = (
  start: WirePoint,
  end: WirePoint,
  width: number,
  connectedTo: string,
): Obstacle => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const rotatedRect = {
    center: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    width: Math.hypot(dx, dy) + width,
    height: width,
    rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
  const axisAlignedRect = getAxisAlignedRectFromRotatedRect(rotatedRect)
  const rect = axisAlignedRect ?? rotatedRect
  return {
    type: "rect",
    layers: [start.layer],
    center: rect.center,
    width: rect.width,
    height: rect.height,
    ...(axisAlignedRect ? {} : { ccwRotationDegrees: rotatedRect.rotation }),
    connectedTo: [connectedTo],
  }
}

/**
 * Autorouter obstacles for the copper of a fixed `pcb_trace` route, such as a
 * `<pcbtrace>` or footprint copper like a solder-jumper bridge. Route points
 * are board-world points in mm.
 *
 * - Each wire segment becomes a rect as wide as its copper, rotated when the
 *   segment is diagonal. Interpolated routes use the wider end of a segment.
 * - Wire points repeated at the same position (e.g. around a via) give a
 *   positive-size square, never a zero-size rect.
 * - Each via becomes a square obstacle on every layer it spans.
 * - `through_pad` points contribute their start and end as wire points.
 */
export const getObstaclesFromRoute = (
  route: PcbTraceRoutePoint[],
  connectedTo: string,
  {
    layerCount = 2,
    routeThicknessMode,
  }: {
    layerCount?: number
    routeThicknessMode?: "constant" | "interpolated"
  } = {},
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  let previousWirePoint: WirePoint | null = null
  let previousWirePointHasSegment = false

  const finishWireRun = () => {
    // An isolated wire point is still a dot of copper
    if (previousWirePoint && !previousWirePointHasSegment) {
      obstacles.push(
        getWireSegmentObstacle(
          previousWirePoint,
          previousWirePoint,
          previousWirePoint.width,
          connectedTo,
        ),
      )
    }
    previousWirePoint = null
    previousWirePointHasSegment = false
  }

  const addWirePoint = (wirePoint: WirePoint) => {
    if (previousWirePoint?.layer !== wirePoint.layer) {
      finishWireRun()
      previousWirePoint = wirePoint
      return
    }
    const width =
      routeThicknessMode === "interpolated"
        ? Math.max(previousWirePoint.width, wirePoint.width)
        : previousWirePoint.width
    obstacles.push(
      getWireSegmentObstacle(previousWirePoint, wirePoint, width, connectedTo),
    )
    previousWirePoint = wirePoint
    previousWirePointHasSegment = true
  }

  for (const routePoint of route) {
    if (routePoint.route_type === "wire") {
      addWirePoint({
        x: routePoint.x,
        y: routePoint.y,
        layer: routePoint.layer,
        width: getPositiveSize(routePoint.width, DEFAULT_TRACE_WIDTH),
      })
    } else if (routePoint.route_type === "through_pad") {
      const width = getPositiveSize(routePoint.width, DEFAULT_TRACE_WIDTH)
      addWirePoint({
        ...routePoint.start,
        layer: routePoint.start_layer,
        width,
      })
      addWirePoint({ ...routePoint.end, layer: routePoint.end_layer, width })
    } else {
      // The via joins the wires on either side of it, which are on different
      // layers, so it also ends the current wire run.
      finishWireRun()
      const viaDiameter = getPositiveSize(
        routePoint.outer_diameter,
        DEFAULT_VIA_DIAMETER,
      )
      obstacles.push({
        type: "rect",
        layers: getViaSpanLayers({
          fromLayer: routePoint.from_layer as LayerRef,
          toLayer: routePoint.to_layer as LayerRef,
          layerCount,
        }),
        center: { x: routePoint.x, y: routePoint.y },
        width: viaDiameter,
        height: viaDiameter,
        connectedTo: [connectedTo],
      })
    }
  }
  finishWireRun()

  return obstacles
}
