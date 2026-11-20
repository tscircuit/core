import type { Point } from "@tscircuit/math-utils"
import type { LayerRef, PcbStackup, PcbTrace } from "circuit-json"

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

/** A point the route passes through, and the copper arriving at it. */
type RouteCorner = {
  point: Point
  layer: LayerRef
  width: number
  viaLength: number
}

/** Default via length, in mm, when neither `pcb_stackup` nor `pcb_board.thickness` is present. */
const DEFAULT_VIA_LENGTH = 1.6

/**
 * Splits a trace route into straight pieces in stored route order.
 *
 * Copper arriving at a wire point uses that wire's layer and width.
 * Copper arriving at a via uses the via's `from_layer` and the last wire's
 * width, so sparse routes still contribute planar length between vias.
 * A via between two different layers adds their Z-distance from
 * `stackup`, else `boardThickness`, else {@link DEFAULT_VIA_LENGTH}.
 *
 * Consecutive pieces that continue in a straight line on the same copper
 * are joined, so how finely a route is split into points doesn't matter.
 */
export function walkTrace({
  trace,
  stackup,
  boardThickness,
}: {
  trace: PcbTrace
  stackup?: PcbStackup
  boardThickness?: number
}): TraceWalk {
  const steps: TraceStep[] = []
  let distance = 0
  let from: RouteCorner | undefined
  let pendingViaLength = 0
  for (const to of routeCorners({ trace, stackup, boardThickness })) {
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
  const step: TraceStep = {
    start: from.point,
    end: to.point,
    layer: to.layer,
    width: to.width,
    startDistance,
    length,
    startViaLength,
    endViaLength: 0,
  }
  const previous = steps[steps.length - 1]
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
  stackup,
  boardThickness,
}: {
  trace: PcbTrace
  stackup?: PcbStackup
  boardThickness?: number
}): RouteCorner[] {
  const corners: RouteCorner[] = []
  let width = 0
  for (const routePoint of trace.route) {
    if (routePoint.route_type === "wire") {
      width = routePoint.width
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.layer,
        width,
        viaLength: 0,
      })
      continue
    }
    if (routePoint.route_type === "via") {
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.from_layer,
        width,
        viaLength: viaLayerDistance({
          fromLayer: routePoint.from_layer,
          toLayer: routePoint.to_layer,
          stackup,
          boardThickness,
        }),
      })
      continue
    }
    // A through-pad point is a straight run across the pad.
    width = routePoint.width
    corners.push({
      point: routePoint.start,
      layer: routePoint.start_layer,
      width,
      viaLength: 0,
    })
    corners.push({
      point: routePoint.end,
      layer: routePoint.start_layer,
      width,
      viaLength: 0,
    })
  }
  return corners
}

/**
 * Z-distance a via travels between two copper layers, in mm. Equal layers add
 * nothing; otherwise uses `stackup` (full outer copper, half inner endpoint
 * copper, all intervening copper and dielectrics), else `boardThickness`, else
 * {@link DEFAULT_VIA_LENGTH}.
 */
function viaLayerDistance({
  fromLayer,
  toLayer,
  stackup,
  boardThickness,
}: {
  fromLayer: LayerRef
  toLayer: LayerRef
  stackup?: PcbStackup
  boardThickness?: number
}): number {
  if (fromLayer === toLayer) return 0
  if (stackup) {
    const distance = stackupLayerDistance({ stackup, fromLayer, toLayer })
    if (distance !== undefined) return distance
  }
  if (
    boardThickness !== undefined &&
    Number.isFinite(boardThickness) &&
    boardThickness >= 0
  ) {
    return boardThickness
  }
  return DEFAULT_VIA_LENGTH
}

/** Z-distance between two copper layers in `stackup`, in mm, or undefined if either is missing. */
function stackupLayerDistance({
  stackup,
  fromLayer,
  toLayer,
}: {
  stackup: PcbStackup
  fromLayer: LayerRef
  toLayer: LayerRef
}): number | undefined {
  const fromIndex = stackup.layers.findIndex(
    (layer) => layer.layer_type === "copper" && layer.layer === fromLayer,
  )
  const toIndex = stackup.layers.findIndex(
    (layer) => layer.layer_type === "copper" && layer.layer === toLayer,
  )
  if (fromIndex < 0 || toIndex < 0) return undefined

  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)
  let total = 0
  for (let index = start; index <= end; index++) {
    const layer = stackup.layers[index]
    const { thickness } = layer
    if (thickness === undefined || !Number.isFinite(thickness) || thickness < 0)
      return undefined
    if (
      layer.layer_type === "copper" &&
      (index === start || index === end) &&
      layer.layer !== "top" &&
      layer.layer !== "bottom"
    ) {
      total += thickness / 2
      continue
    }
    total += thickness
  }
  return total
}
