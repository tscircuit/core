import type {
  LayerRef,
  LocalSkewRouteStep,
  PcbPort,
  PcbTrace,
  Point,
} from "circuit-json"
import {
  type LayerChangeBoard,
  getLayerChangeLength,
} from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"

/**
 * A straight copper piece in PCB world XY (mm, +X right, +Y up, +Z above)
 * and its starting distance along the walk.
 */
export type TraceStep = {
  start: Point
  end: Point
  layer: LayerRef
  width: number
  /** Distance along the walk from its first point to `start`, in mm. */
  startDistance: number
  length: number
  /** Length of any layer change directly before `start`, in mm. */
  startViaLength: number
  /** Length of any layer change directly after `end`, in mm. */
  endViaLength: number
}

/** One route edge of a walk with planar length, and where it starts along the walk. */
export type WalkEdge = {
  routeStep: LocalSkewRouteStep
  /** Distance along the walk from its first point to the edge's start, in mm. */
  startDistance: number
  /** Planar length of the edge, in mm. */
  length: number
}

/**
 * One side's copper in walk order: its straight steps, its route edges,
 * its length including layer changes in mm and the ports at its ends.
 */
export type TraceWalk = {
  steps: TraceStep[]
  edges: WalkEdge[]
  length: number
  startPcbPortId: PcbPort["pcb_port_id"] | undefined
  endPcbPortId: PcbPort["pcb_port_id"] | undefined
}

/** A route point with the incoming copper layer and outgoing copper width. */
type RouteCorner = {
  point: Point
  layer: LayerRef
  width: number
  viaLength: number
  /** Index of the route edge whose copper arrives at this corner, or null for the copper across a through pad. */
  edgeIndex: number | null
}

/** The ports a PCB trace's route starts and ends at, when it names them. */
export type TraceEndPorts = Pick<TraceWalk, "startPcbPortId" | "endPcbPortId">

/** Cosine above which two steps count as one straight line (about 0.003°). */
const STRAIGHT_COSINE = 1 - 1e-9

/**
 * Splits a trace route into straight pieces in stored route order.
 *
 * A planar piece uses its start point's width, including the starting
 * width of a taper. Vias carry the last wire width for sparse routes.
 * Vias and through pads that change layers add the same Z-distance as
 * `trace_length` does, from {@link getLayerChangeLength}.
 *
 * Consecutive pieces that continue in a straight line on the same copper
 * are joined, so how finely a route is split into points doesn't matter.
 */
export function walkTrace({
  pcbTrace,
  pcbStackup,
  boardThickness,
}: { pcbTrace: PcbTrace } & LayerChangeBoard): TraceWalk {
  const steps: TraceStep[] = []
  const edges: WalkEdge[] = []
  let distance = 0
  let from: RouteCorner | undefined
  let pendingViaLength = 0
  for (const to of routeCorners({ pcbTrace, pcbStackup, boardThickness })) {
    if (from) {
      const length = Math.hypot(
        to.point.x - from.point.x,
        to.point.y - from.point.y,
      )
      if (length > 0 && to.edgeIndex !== null) {
        edges.push({
          routeStep: {
            pcb_trace_id: pcbTrace.pcb_trace_id,
            edge_index: to.edgeIndex,
            reverse: false,
          },
          startDistance: distance,
          length,
        })
      }
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
  return {
    steps,
    edges,
    length: distance,
    ...getTraceEndPorts(pcbTrace),
  }
}

/** The ports named by the first and last wire points of a route. */
export function getTraceEndPorts(pcbTrace: PcbTrace): TraceEndPorts {
  let startPcbPortId: PcbPort["pcb_port_id"] | undefined
  let endPcbPortId: PcbPort["pcb_port_id"] | undefined
  for (const routePoint of pcbTrace.route) {
    if (routePoint.route_type !== "wire") continue
    startPcbPortId ??= routePoint.start_pcb_port_id
    endPcbPortId = routePoint.end_pcb_port_id ?? endPcbPortId
  }
  return { startPcbPortId, endPcbPortId }
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
  /** Length of any layer change directly before `start`, in mm. */
  startViaLength: number
}): void {
  const step: TraceStep = {
    start: from.point,
    end: to.point,
    layer: to.layer,
    width: from.width,
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
    edges: walk.edges
      .map((edge) => ({
        routeStep: { ...edge.routeStep, reverse: !edge.routeStep.reverse },
        startDistance: walk.length - edge.startDistance - edge.length,
        length: edge.length,
      }))
      .reverse(),
    startPcbPortId: walk.endPcbPortId,
    endPcbPortId: walk.startPcbPortId,
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

/**
 * Joins walks that meet end to end into one, in the order given. Distances
 * carry on from one walk to the next; the hop across a pad the two share is
 * not trace copper and adds nothing, as in the sum of their `trace_length`s.
 */
export function joinWalks(walks: TraceWalk[]): TraceWalk {
  const joined: TraceWalk = {
    steps: [],
    edges: [],
    length: 0,
    startPcbPortId: walks[0].startPcbPortId,
    endPcbPortId: walks[walks.length - 1].endPcbPortId,
  }
  for (const walk of walks) {
    for (const step of walk.steps) {
      joined.steps.push({
        ...step,
        startDistance: joined.length + step.startDistance,
      })
    }
    for (const edge of walk.edges) {
      joined.edges.push({
        ...edge,
        startDistance: joined.length + edge.startDistance,
      })
    }
    joined.length += walk.length
  }
  return joined
}

/** The corners and layer transitions of a walk in stored route order. */
function routeCorners({
  pcbTrace,
  pcbStackup,
  boardThickness,
}: { pcbTrace: PcbTrace } & LayerChangeBoard): RouteCorner[] {
  const corners: RouteCorner[] = []
  let width = 0
  for (const [routeIndex, routePoint] of pcbTrace.route.entries()) {
    // The edge from the previous route point arrives at this point's first corner.
    const edgeIndex = routeIndex - 1
    if (routePoint.route_type === "wire") {
      width = routePoint.width
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.layer,
        width,
        viaLength: 0,
        edgeIndex,
      })
      continue
    }
    if (routePoint.route_type === "via") {
      corners.push({
        point: { x: routePoint.x, y: routePoint.y },
        layer: routePoint.from_layer,
        width,
        viaLength: getLayerChangeLength({
          fromLayer: routePoint.from_layer,
          toLayer: routePoint.to_layer,
          pcbStackup,
          boardThickness,
        }),
        edgeIndex,
      })
      continue
    }
    // Walk across the pad before adding the layer transition at its end.
    width = routePoint.width
    corners.push({
      point: routePoint.start,
      layer: routePoint.start_layer,
      width,
      viaLength: 0,
      edgeIndex,
    })
    corners.push({
      point: routePoint.end,
      layer: routePoint.start_layer,
      width,
      viaLength: getLayerChangeLength({
        fromLayer: routePoint.start_layer,
        toLayer: routePoint.end_layer,
        pcbStackup,
        boardThickness,
      }),
      edgeIndex: null,
    })
  }
  return corners
}
