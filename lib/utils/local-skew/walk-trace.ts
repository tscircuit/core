import type { Point } from "@tscircuit/math-utils"
import type { LayerRef, PcbTrace } from "circuit-json"
import {
  type LayerChangeBoard,
  getLayerChangeLength,
} from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"

/**
 * A straight copper piece in PCB world XY (mm, +X right, +Y up, +Z above)
 * and its starting distance along the trace.
 */
export type TraceStep = {
  start: Point
  end: Point
  layer: LayerRef
  width: number
  /** Distance along the walk from its first point to `start`, in mm. */
  startDistance: number
  length: number
  /** Length of any via directly before `start`, in mm. */
  startViaLength: number
  /** Length of any via directly after `end`, in mm. */
  endViaLength: number
}

/** A trace's steps in walk order, and its total length including vias, in mm. */
export type TraceWalk = {
  steps: TraceStep[]
  length: number
}

/** A point the route passes through, the layer of the copper arriving at it, and its own width (none for a via). */
type RouteCorner = {
  point: Point
  layer: LayerRef
  width: number | undefined
  viaLength: number
}

/**
 * Splits a trace route into straight pieces in stored route order.
 *
 * Copper arriving at a wire point uses that wire's layer; copper arriving
 * at a via uses the via's `from_layer`. Each piece is as wide as its start
 * point, or its end point when it starts at a via, as renderers draw it. A
 * piece from one via to the next keeps the previous piece's width.
 * A via, or a through pad, between two different layers adds their
 * Z-distance, measured as `pcb_trace.trace_length` measures it.
 *
 * Consecutive pieces that continue in a straight line on the same copper
 * are joined, so how finely a route is split into points doesn't matter.
 */
export function walkTrace({
  trace,
  pcbStackup,
  boardThickness,
}: { trace: PcbTrace } & LayerChangeBoard): TraceWalk {
  const steps: TraceStep[] = []
  let distance = 0
  let from: RouteCorner | undefined
  let pendingViaLength = 0
  for (const to of routeCorners({ trace, pcbStackup, boardThickness })) {
    if (from) {
      const length = Math.hypot(
        to.point.x - from.point.x,
        to.point.y - from.point.y,
      )
      if (length > 0) {
        addStep({
          steps,
          from,
          to,
          startDistance: distance,
          length,
          startViaLength: pendingViaLength,
        })
        pendingViaLength = 0
      }
      distance += length
    }
    if (to.viaLength > 0) {
      distance += to.viaLength
      pendingViaLength += to.viaLength
      const previous = steps[steps.length - 1]
      if (previous) previous.endViaLength += to.viaLength
    }
    from = to
  }
  return { steps, length: distance }
}

/** Appends the step from one corner to the next, joining it to the previous step when it carries straight on. */
function addStep({
  steps,
  from,
  to,
  startDistance,
  length,
  startViaLength,
}: {
  steps: TraceStep[]
  from: RouteCorner
  to: RouteCorner
  startDistance: number
  length: number
  /** Length of any via directly before `start`, in mm. */
  startViaLength: number
}): void {
  const previous = steps[steps.length - 1]
  const width = from.width ?? to.width ?? previous?.width
  if (width === undefined) return
  const step: TraceStep = {
    start: from.point,
    end: to.point,
    layer: to.layer,
    width,
    startDistance,
    length,
    startViaLength,
    endViaLength: 0,
  }
  if (
    previous &&
    startViaLength === 0 &&
    continuesStraight({ previous, next: step })
  ) {
    previous.end = step.end
    previous.length += step.length
    return
  }
  steps.push(step)
}

/** Cosine above which two steps count as one straight line (about 0.003°). */
const STRAIGHT_COSINE = 1 - 1e-9

/** True when `next` carries on from `previous` in a straight line on the same layer and width. */
function continuesStraight({
  previous,
  next,
}: {
  previous: TraceStep
  next: TraceStep
}): boolean {
  if (previous.layer !== next.layer || previous.width !== next.width) {
    return false
  }
  const cosine =
    ((previous.end.x - previous.start.x) * (next.end.x - next.start.x) +
      (previous.end.y - previous.start.y) * (next.end.y - next.start.y)) /
    (previous.length * next.length)
  return cosine >= STRAIGHT_COSINE
}

/** The same copper walked from the other end. Each step keeps its layer and width. */
export function reverseWalk(walk: TraceWalk): TraceWalk {
  return {
    length: walk.length,
    steps: walk.steps
      .map((step) => ({
        ...step,
        start: step.end,
        end: step.start,
        startDistance: walk.length - step.startDistance - step.length,
        startViaLength: step.endViaLength,
        endViaLength: step.startViaLength,
      }))
      .reverse(),
  }
}

/** The route's points in order, each with the copper arriving at it. */
function routeCorners({
  trace,
  pcbStackup,
  boardThickness,
}: { trace: PcbTrace } & LayerChangeBoard): RouteCorner[] {
  const corners: RouteCorner[] = []
  for (const routePoint of trace.route) {
    if (routePoint.route_type === "wire") {
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.layer,
        width: routePoint.width,
        viaLength: 0,
      })
      continue
    }
    if (routePoint.route_type === "via") {
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.from_layer,
        width: undefined,
        viaLength: getLayerChangeLength({
          fromLayer: routePoint.from_layer,
          toLayer: routePoint.to_layer,
          pcbStackup,
          boardThickness,
        }),
      })
      continue
    }
    // A through-pad point is a straight run across the pad, which then
    // changes layers like a via when its end layer differs.
    corners.push({
      point: routePoint.start,
      layer: routePoint.start_layer,
      width: routePoint.width,
      viaLength: 0,
    })
    corners.push({
      point: routePoint.end,
      layer: routePoint.start_layer,
      width: routePoint.width,
      viaLength: getLayerChangeLength({
        fromLayer: routePoint.start_layer,
        toLayer: routePoint.end_layer,
        pcbStackup,
        boardThickness,
      }),
    })
  }
  return corners
}
