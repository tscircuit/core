import {
  doSegmentsIntersect,
  pointToSegmentDistance,
  segmentToSegmentMinDistance,
} from "@tscircuit/math-utils"
import type {
  SimpleRouteBounds,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "./SimpleRouteJson"

const GEOMETRY_EPSILON = 1e-6

type WireRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "wire" }
>

interface BoardPoint {
  x: number
  y: number
}

interface TraceSegment {
  traceId: string
  connectionName: SrjConnectionName
  segmentIndex: number
  start: BoardPoint
  end: BoardPoint
  width: number
  layer: string
}

interface TraceVia {
  traceId: string
  connectionName: SrjConnectionName
  center: BoardPoint
  diameter: number
  layers?: readonly string[]
}

export interface TraceLengthMatchGroup {
  connectionNames: readonly SrjConnectionName[]
  /** Maximum permitted end-to-end skew in millimeters. */
  maxSkew: number
}

export interface TraceBundleClearanceViolation {
  code:
    | "different_net_trace_clearance"
    | "different_net_trace_via_clearance"
    | "different_net_via_via_clearance"
    | "same_net_overlap_outside_endpoint"
    | "self_intersection"
    | "self_trace_clearance"
    | "outside_bounds"
  traceId: string
  connectionName: SrjConnectionName
  otherTraceId?: string
  otherConnectionName?: SrjConnectionName
  layer?: string
  measuredDistance?: number
  requiredDistance?: number
}

export interface TraceLengthMatchDiagnostic {
  connectionNames: readonly SrjConnectionName[]
  beforeSkew: number
  afterSkew: number
  addedLengthByConnectionName: ReadonlyMap<SrjConnectionName, number>
  meanderToothCountByConnectionName: ReadonlyMap<SrjConnectionName, number>
}

export interface PostprocessOrthogonalTraceBundleResult {
  traces: SimplifiedPcbTrace[]
  lengthMatchDiagnostics: TraceLengthMatchDiagnostic[]
  clearanceViolations: TraceBundleClearanceViolation[]
}

export interface PostprocessOrthogonalTraceBundleParams {
  /**
   * Mutable route geometry in board/circuit world coordinates. +X is right,
   * +Y is top, and all distances are millimeters. Route entries are points.
   * Post-processing expects via-free wire routes on one layer; the exported
   * clearance validator can independently check via-bearing traces.
   */
  traces: readonly SimplifiedPcbTrace[]
  /** Existing copper that the post-processed traces must continue to avoid. */
  immutableTraces?: readonly SimplifiedPcbTrace[]
  /**
   * Maps immutable trace ids onto the mutable route's electrical connection.
   * This permits the localized copper join at an exact shared route endpoint
   * with that route's own fanout, but not overlap elsewhere.
   */
  immutableTraceConnectionNameByPcbTraceId?: ReadonlyMap<
    string,
    SrjConnectionName
  >
  /** Fixed source/target escape length included in end-to-end matching. */
  fixedLengthByConnectionName?: ReadonlyMap<SrjConnectionName, number>
  lengthMatchGroups?: readonly TraceLengthMatchGroup[]
  /**
   * Requested maximum relief cut at each orthogonal corner, in millimeters.
   * Shared legs are budgeted automatically, so the actual cut may be smaller.
   */
  chamfer?: number
  /** Required copper-edge gap between different-net traces, in millimeters. */
  traceClearance?: number
  /** Required copper-edge gap from different-net vias, in millimeters. */
  viaClearance?: number
  /** Pad diameter used only when a route via omits `via_diameter`. */
  viaDiameterFallback?: number
  maxMeanderAmplitude?: number
  meanderFlatLength?: number
  meanderGapLength?: number
  meanderLeadLength?: number
  meanderTailLength?: number
  bounds?: SimpleRouteBounds
}

const distance = (first: BoardPoint, second: BoardPoint) =>
  Math.hypot(second.x - first.x, second.y - first.y)

const pointsMatch = (first: BoardPoint, second: BoardPoint) =>
  distance(first, second) <= GEOMETRY_EPSILON

const segmentsMeetOnlyAtSharedEndpoint = (
  first: TraceSegment,
  second: TraceSegment,
): boolean => {
  const endpointPairs = [
    [first.start, first.end, second.start, second.end],
    [first.start, first.end, second.end, second.start],
    [first.end, first.start, second.start, second.end],
    [first.end, first.start, second.end, second.start],
  ] as const
  for (const [
    sharedFirst,
    otherFirst,
    sharedSecond,
    otherSecond,
  ] of endpointPairs) {
    if (!pointsMatch(sharedFirst, sharedSecond)) continue
    const firstLength = distance(sharedFirst, otherFirst)
    const secondLength = distance(sharedSecond, otherSecond)
    if (firstLength <= GEOMETRY_EPSILON || secondLength <= GEOMETRY_EPSILON) {
      continue
    }
    const firstDirection = {
      x: (otherFirst.x - sharedFirst.x) / firstLength,
      y: (otherFirst.y - sharedFirst.y) / firstLength,
    }
    const secondDirection = {
      x: (otherSecond.x - sharedSecond.x) / secondLength,
      y: (otherSecond.y - sharedSecond.y) / secondLength,
    }
    const cross =
      firstDirection.x * secondDirection.y -
      firstDirection.y * secondDirection.x
    const dot =
      firstDirection.x * secondDirection.x +
      firstDirection.y * secondDirection.y
    // Collinear rays heading in the same direction overlap beyond the endpoint.
    return Math.abs(cross) > GEOMETRY_EPSILON || dot <= GEOMETRY_EPSILON
  }
  return false
}

const segmentTouchesViaOnlyAtEndpoint = (
  segment: TraceSegment,
  via: TraceVia,
) =>
  pointsMatch(segment.start, via.center) || pointsMatch(segment.end, via.center)

const viaUsesLayer = (via: TraceVia, layer: string) =>
  via.layers?.includes(layer) ?? true

const viasShareLayer = (first: TraceVia, second: TraceVia) =>
  first.layers === undefined ||
  second.layers === undefined ||
  first.layers.some((layer) => second.layers!.includes(layer))

const getTraceConnectionName = (
  trace: SimplifiedPcbTrace,
  connectionNameByTraceId?: ReadonlyMap<string, SrjConnectionName>,
): SrjConnectionName =>
  connectionNameByTraceId?.get(trace.pcb_trace_id) ??
  trace.connection_name ??
  trace.pcb_trace_id

/** Returns planar copper length in board/circuit world millimeters. */
export const getPlanarTraceLength = (trace: SimplifiedPcbTrace): number => {
  let length = 0
  for (let routeIndex = 0; routeIndex < trace.route.length - 1; routeIndex++) {
    const start = trace.route[routeIndex]!
    const end = trace.route[routeIndex + 1]!
    if (start.route_type !== "wire") continue
    if (end.route_type !== "wire" && end.route_type !== "via") continue
    if (end.route_type === "wire" && start.layer !== end.layer) continue
    length += distance(start, end)
  }
  return length
}

const getTraceSegments = (
  trace: SimplifiedPcbTrace,
  connectionNameByTraceId?: ReadonlyMap<string, SrjConnectionName>,
): TraceSegment[] => {
  const segments: TraceSegment[] = []
  let wireSegmentIndex = 0
  for (let routeIndex = 0; routeIndex < trace.route.length - 1; routeIndex++) {
    const start = trace.route[routeIndex]!
    const end = trace.route[routeIndex + 1]!
    if (start.route_type !== "wire") continue
    if (end.route_type !== "wire" && end.route_type !== "via") continue
    if (end.route_type === "wire" && start.layer !== end.layer) continue
    if (!pointsMatch(start, end)) {
      segments.push({
        traceId: trace.pcb_trace_id,
        connectionName: getTraceConnectionName(trace, connectionNameByTraceId),
        segmentIndex: wireSegmentIndex,
        start,
        end,
        width: start.width,
        layer: start.layer,
      })
      wireSegmentIndex += 1
    }
  }
  return segments
}

const getTraceVias = (
  trace: SimplifiedPcbTrace,
  connectionNameByTraceId?: ReadonlyMap<string, SrjConnectionName>,
  viaDiameterFallback?: number,
): TraceVia[] =>
  trace.route.flatMap((routePoint) => {
    if (routePoint.route_type !== "via") return []
    const diameter = routePoint.via_diameter ?? viaDiameterFallback
    if (diameter === undefined || !Number.isFinite(diameter) || diameter <= 0) {
      throw new Error(
        `Via in trace ${trace.pcb_trace_id} is missing a positive via_diameter; pass viaDiameterFallback`,
      )
    }
    return [
      {
        traceId: trace.pcb_trace_id,
        connectionName: getTraceConnectionName(trace, connectionNameByTraceId),
        center: { x: routePoint.x, y: routePoint.y },
        diameter,
        layers: routePoint.layers,
      },
    ]
  })

const getTraceCopperEndpoints = (trace: SimplifiedPcbTrace): BoardPoint[] => {
  const copperPoints = trace.route.flatMap((routePoint) =>
    routePoint.route_type === "wire" || routePoint.route_type === "via"
      ? [{ x: routePoint.x, y: routePoint.y }]
      : [],
  )
  if (copperPoints.length === 0) return []
  if (copperPoints.length === 1) return [copperPoints[0]!]
  return [copperPoints[0]!, copperPoints.at(-1)!]
}

const isOctilinearSegment = (start: BoardPoint, end: BoardPoint) => {
  const deltaX = Math.abs(end.x - start.x)
  const deltaY = Math.abs(end.y - start.y)
  return (
    deltaX <= GEOMETRY_EPSILON ||
    deltaY <= GEOMETRY_EPSILON ||
    Math.abs(deltaX - deltaY) <= GEOMETRY_EPSILON
  )
}

const assertTraceIsOctilinear = (trace: SimplifiedPcbTrace): void => {
  const segments = getTraceSegments(trace)
  for (const segment of segments) {
    if (!isOctilinearSegment(segment.start, segment.end)) {
      throw new Error(
        `Post-processed trace ${trace.pcb_trace_id} contains a non-octilinear segment`,
      )
    }
  }

  for (let segmentIndex = 1; segmentIndex < segments.length; segmentIndex++) {
    const previous = segments[segmentIndex - 1]!
    const current = segments[segmentIndex]!
    if (
      previous.layer !== current.layer ||
      !pointsMatch(previous.end, current.start)
    ) {
      continue
    }
    const previousLength = distance(previous.start, previous.end)
    const currentLength = distance(current.start, current.end)
    const previousDirection = {
      x: (previous.end.x - previous.start.x) / previousLength,
      y: (previous.end.y - previous.start.y) / previousLength,
    }
    const currentDirection = {
      x: (current.end.x - current.start.x) / currentLength,
      y: (current.end.y - current.start.y) / currentLength,
    }
    const dot = Math.max(
      -1,
      Math.min(
        1,
        previousDirection.x * currentDirection.x +
          previousDirection.y * currentDirection.y,
      ),
    )
    const turnDegrees = (Math.acos(dot) * 180) / Math.PI
    if (turnDegrees > 45 + GEOMETRY_EPSILON) {
      throw new Error(
        `Post-processed trace ${trace.pcb_trace_id} contains a ${turnDegrees.toFixed(3)} degree turn`,
      )
    }
  }
}

const cloneTrace = (trace: SimplifiedPcbTrace): SimplifiedPcbTrace =>
  structuredClone(trace)

/**
 * Replaces perpendicular corners with two points joined by a 45-degree edge.
 * Relief is allocated per segment: compatible neighboring diagonals can meet
 * at the geometric maximum, while other folds retain self-clearance. Geometry
 * is in board/circuit world coordinates and millimeters.
 */
export const chamferOrthogonalTrace = (
  trace: SimplifiedPcbTrace,
  requestedChamfer: number,
): SimplifiedPcbTrace => {
  const route = trace.route
  if (route.length < 3 || requestedChamfer <= GEOMETRY_EPSILON) {
    return cloneTrace(trace)
  }
  if (route.some((routePoint) => routePoint.route_type !== "wire")) {
    throw new Error(
      `Trace ${trace.pcb_trace_id} must contain only same-layer wire points before chamfering`,
    )
  }

  const wireRoute = route as WireRoutePoint[]
  const chamferByRouteIndex = new Array<number>(wireRoute.length).fill(0)
  const diagonalDirectionByRouteIndex = new Array<BoardPoint | undefined>(
    wireRoute.length,
  )
  for (let routeIndex = 1; routeIndex < wireRoute.length - 1; routeIndex++) {
    const previous = wireRoute[routeIndex - 1]!
    const corner = wireRoute[routeIndex]!
    const next = wireRoute[routeIndex + 1]!
    if (previous.layer !== corner.layer || corner.layer !== next.layer) {
      throw new Error(
        `Trace ${trace.pcb_trace_id} changes layers without an explicit via`,
      )
    }
    const incomingLength = distance(previous, corner)
    const outgoingLength = distance(corner, next)
    if (
      incomingLength <= GEOMETRY_EPSILON ||
      outgoingLength <= GEOMETRY_EPSILON
    ) {
      continue
    }
    const incomingDirection = {
      x: (corner.x - previous.x) / incomingLength,
      y: (corner.y - previous.y) / incomingLength,
    }
    const outgoingDirection = {
      x: (next.x - corner.x) / outgoingLength,
      y: (next.y - corner.y) / outgoingLength,
    }
    const dot =
      incomingDirection.x * outgoingDirection.x +
      incomingDirection.y * outgoingDirection.y
    if (Math.abs(dot) > GEOMETRY_EPSILON) continue
    chamferByRouteIndex[routeIndex] = Math.min(
      requestedChamfer,
      incomingLength,
      outgoingLength,
    )
    diagonalDirectionByRouteIndex[routeIndex] = {
      x: incomingDirection.x + outgoingDirection.x,
      y: incomingDirection.y + outgoingDirection.y,
    }
  }

  const sharedSegmentIsCollapseCompatible = new Array<boolean>(
    wireRoute.length - 1,
  ).fill(false)
  for (
    let segmentIndex = 0;
    segmentIndex < wireRoute.length - 1;
    segmentIndex++
  ) {
    const startDiagonal = diagonalDirectionByRouteIndex[segmentIndex]
    const endDiagonal = diagonalDirectionByRouteIndex[segmentIndex + 1]
    if (!startDiagonal || !endDiagonal) continue
    const cross =
      startDiagonal.x * endDiagonal.y - startDiagonal.y * endDiagonal.x
    const dot =
      startDiagonal.x * endDiagonal.x + startDiagonal.y * endDiagonal.y
    sharedSegmentIsCollapseCompatible[segmentIndex] =
      Math.abs(cross) <= GEOMETRY_EPSILON && dot > 0
  }

  const getNoncollapsedSharedSegmentBudget = (segmentIndex: number) => {
    const segmentLength = distance(
      wireRoute[segmentIndex]!,
      wireRoute[segmentIndex + 1]!,
    )
    const hasTwoCornerDiagonals =
      diagonalDirectionByRouteIndex[segmentIndex] !== undefined &&
      diagonalDirectionByRouteIndex[segmentIndex + 1] !== undefined
    if (!hasTwoCornerDiagonals) return segmentLength
    const minimumStraightLength =
      Math.max(
        wireRoute[segmentIndex]!.width,
        wireRoute[segmentIndex + 1]!.width,
      ) *
        Math.SQRT2 +
      GEOMETRY_EPSILON
    return Math.max(0, segmentLength - minimumStraightLength)
  }

  const limitSharedSegmentToNoncollapsedBudget = (segmentIndex: number) => {
    const startChamfer = chamferByRouteIndex[segmentIndex]!
    const endChamfer = chamferByRouteIndex[segmentIndex + 1]!
    const combinedChamfer = startChamfer + endChamfer
    const budget = getNoncollapsedSharedSegmentBudget(segmentIndex)
    if (combinedChamfer <= budget + GEOMETRY_EPSILON) return
    const scale = budget / combinedChamfer
    chamferByRouteIndex[segmentIndex] = startChamfer * scale
    chamferByRouteIndex[segmentIndex + 1] = endChamfer * scale
  }

  // First constrain incompatible neighboring folds. This only reduces relief,
  // so a later edge cannot invalidate a budget that was already processed.
  for (
    let segmentIndex = 0;
    segmentIndex < wireRoute.length - 1;
    segmentIndex++
  ) {
    if (sharedSegmentIsCollapseCompatible[segmentIndex]) continue
    limitSharedSegmentToNoncollapsedBudget(segmentIndex)
  }

  // Compatible consecutive corners form a staircase whose diagonal reliefs
  // can meet exactly. Solve the entire run as c[k] + c[k + 1] = segmentLength
  // instead of clipping pairs independently, which can leave an unsafe tiny
  // residual when a later pair changes a relief shared with an earlier pair.
  const collapsedSharedSegments = new Set<number>()
  for (let firstCornerIndex = 1; firstCornerIndex < wireRoute.length - 2; ) {
    if (!sharedSegmentIsCollapseCompatible[firstCornerIndex]) {
      firstCornerIndex++
      continue
    }
    let lastCornerIndex = firstCornerIndex + 1
    while (sharedSegmentIsCollapseCompatible[lastCornerIndex]) {
      lastCornerIndex++
    }

    const coefficientByCornerIndex = new Map<
      number,
      { sign: -1 | 1; offset: number }
    >()
    let sign: -1 | 1 = 1
    let offset = 0
    let minimumFirstRelief = 0
    let maximumFirstRelief = Number.POSITIVE_INFINITY
    for (
      let cornerIndex = firstCornerIndex;
      cornerIndex <= lastCornerIndex;
      cornerIndex++
    ) {
      coefficientByCornerIndex.set(cornerIndex, { sign, offset })
      const reliefCap = chamferByRouteIndex[cornerIndex]!
      if (sign === 1) {
        minimumFirstRelief = Math.max(minimumFirstRelief, -offset)
        maximumFirstRelief = Math.min(maximumFirstRelief, reliefCap - offset)
      } else {
        minimumFirstRelief = Math.max(minimumFirstRelief, offset - reliefCap)
        maximumFirstRelief = Math.min(maximumFirstRelief, offset)
      }
      if (cornerIndex < lastCornerIndex) {
        const segmentLength = distance(
          wireRoute[cornerIndex]!,
          wireRoute[cornerIndex + 1]!,
        )
        sign = sign === 1 ? -1 : 1
        offset = segmentLength - offset
      }
    }

    if (minimumFirstRelief <= maximumFirstRelief + GEOMETRY_EPSILON) {
      const cornerCount = lastCornerIndex - firstCornerIndex + 1
      let firstRelief: number
      if (cornerCount % 2 === 1) {
        // Odd runs have one net degree of relief: use its maximum.
        firstRelief = maximumFirstRelief
      } else {
        // Even runs have constant total relief. Preserve the proportional
        // allocation used for an isolated pair, then clamp to run feasibility.
        const firstCap = chamferByRouteIndex[firstCornerIndex]!
        const secondCap = chamferByRouteIndex[firstCornerIndex + 1]!
        const firstSegmentLength = distance(
          wireRoute[firstCornerIndex]!,
          wireRoute[firstCornerIndex + 1]!,
        )
        const proportionalRelief =
          (firstSegmentLength * firstCap) / (firstCap + secondCap)
        firstRelief = Math.max(
          minimumFirstRelief,
          Math.min(maximumFirstRelief, proportionalRelief),
        )
      }
      for (
        let cornerIndex = firstCornerIndex;
        cornerIndex <= lastCornerIndex;
        cornerIndex++
      ) {
        const coefficient = coefficientByCornerIndex.get(cornerIndex)!
        const relief = coefficient.sign * firstRelief + coefficient.offset
        chamferByRouteIndex[cornerIndex] =
          Math.abs(relief) <= GEOMETRY_EPSILON ? 0 : relief
        if (cornerIndex < lastCornerIndex) {
          collapsedSharedSegments.add(cornerIndex)
        }
      }
    } else {
      // If the complete staircase cannot collapse within all corner caps,
      // conservatively keep every shared leg clear of the forbidden gap.
      for (
        let segmentIndex = firstCornerIndex;
        segmentIndex < lastCornerIndex;
        segmentIndex++
      ) {
        limitSharedSegmentToNoncollapsedBudget(segmentIndex)
      }
    }
    firstCornerIndex = lastCornerIndex
  }

  // Keep allocation correctness local and explicit: a shared leg is either an
  // exact diagonal collapse or has enough straight centerline for disjoint
  // copper. Never emit geometry in the narrow, ambiguous band between them.
  for (
    let segmentIndex = 0;
    segmentIndex < wireRoute.length - 1;
    segmentIndex++
  ) {
    const combinedChamfer =
      chamferByRouteIndex[segmentIndex]! +
      chamferByRouteIndex[segmentIndex + 1]!
    if (collapsedSharedSegments.has(segmentIndex)) {
      const segmentLength = distance(
        wireRoute[segmentIndex]!,
        wireRoute[segmentIndex + 1]!,
      )
      if (Math.abs(combinedChamfer - segmentLength) > GEOMETRY_EPSILON) {
        throw new Error(
          `Could not preserve collapsed corner relief for trace ${trace.pcb_trace_id}`,
        )
      }
      continue
    }
    if (
      combinedChamfer >
      getNoncollapsedSharedSegmentBudget(segmentIndex) + GEOMETRY_EPSILON
    ) {
      throw new Error(
        `Could not allocate clearance-safe corner relief for trace ${trace.pcb_trace_id}`,
      )
    }
  }

  const chamferedRoute: WireRoutePoint[] = [{ ...wireRoute[0]! }]
  for (let routeIndex = 1; routeIndex < wireRoute.length - 1; routeIndex++) {
    const previous = wireRoute[routeIndex - 1]!
    const corner = wireRoute[routeIndex]!
    const next = wireRoute[routeIndex + 1]!
    const chamfer = chamferByRouteIndex[routeIndex]!
    if (chamfer <= GEOMETRY_EPSILON) {
      chamferedRoute.push({ ...corner })
      continue
    }
    const incomingLength = distance(previous, corner)
    const outgoingLength = distance(corner, next)
    const incomingDirection = {
      x: (corner.x - previous.x) / incomingLength,
      y: (corner.y - previous.y) / incomingLength,
    }
    const outgoingDirection = {
      x: (next.x - corner.x) / outgoingLength,
      y: (next.y - corner.y) / outgoingLength,
    }
    chamferedRoute.push({
      ...corner,
      x: corner.x - incomingDirection.x * chamfer,
      y: corner.y - incomingDirection.y * chamfer,
      width: Math.max(previous.width, corner.width),
    })
    chamferedRoute.push({
      ...corner,
      x: corner.x + outgoingDirection.x * chamfer,
      y: corner.y + outgoingDirection.y * chamfer,
    })
  }
  chamferedRoute.push({ ...wireRoute.at(-1)! })
  const compactedRoute: WireRoutePoint[] = []
  for (const point of chamferedRoute) {
    const previous = compactedRoute.at(-1)
    if (
      previous &&
      previous.layer === point.layer &&
      pointsMatch(previous, point)
    ) {
      compactedRoute[compactedRoute.length - 1] = {
        ...previous,
        ...point,
        width: Math.max(previous.width, point.width),
      }
      continue
    }
    compactedRoute.push(point)
  }
  return { ...cloneTrace(trace), route: compactedRoute }
}

const pointIsInsideBounds = (
  point: BoardPoint,
  bounds: SimpleRouteBounds,
  inset: number,
) =>
  point.x >= bounds.minX + inset - GEOMETRY_EPSILON &&
  point.x <= bounds.maxX - inset + GEOMETRY_EPSILON &&
  point.y >= bounds.minY + inset - GEOMETRY_EPSILON &&
  point.y <= bounds.maxY - inset + GEOMETRY_EPSILON

/** Independently checks mutable routes against each other and fixed copper. */
export const getTraceBundleClearanceViolations = ({
  traces,
  immutableTraces = [],
  immutableTraceConnectionNameByPcbTraceId,
  traceClearance,
  viaClearance,
  viaDiameterFallback,
  bounds,
}: {
  traces: readonly SimplifiedPcbTrace[]
  immutableTraces?: readonly SimplifiedPcbTrace[]
  immutableTraceConnectionNameByPcbTraceId?: ReadonlyMap<
    string,
    SrjConnectionName
  >
  traceClearance: number
  viaClearance: number
  viaDiameterFallback?: number
  bounds?: SimpleRouteBounds
}): TraceBundleClearanceViolation[] => {
  if (!Number.isFinite(traceClearance) || traceClearance < 0) {
    throw new Error("traceClearance must be finite and non-negative")
  }
  if (!Number.isFinite(viaClearance) || viaClearance < 0) {
    throw new Error("viaClearance must be finite and non-negative")
  }
  if (
    viaDiameterFallback !== undefined &&
    (!Number.isFinite(viaDiameterFallback) || viaDiameterFallback <= 0)
  ) {
    throw new Error("viaDiameterFallback must be finite and positive")
  }
  const violations: TraceBundleClearanceViolation[] = []
  const mutableSegments = traces.flatMap((trace) => getTraceSegments(trace))
  const mutableVias = traces.flatMap((trace) =>
    getTraceVias(trace, undefined, viaDiameterFallback),
  )
  const immutableSegments = immutableTraces.flatMap((trace) =>
    getTraceSegments(trace, immutableTraceConnectionNameByPcbTraceId),
  )
  const immutableVias = immutableTraces.flatMap((trace) =>
    getTraceVias(
      trace,
      immutableTraceConnectionNameByPcbTraceId,
      viaDiameterFallback,
    ),
  )
  const endpointsByTraceId = new Map(
    [...immutableTraces, ...traces].map((trace) => [
      trace.pcb_trace_id,
      getTraceCopperEndpoints(trace),
    ]),
  )

  const sameNetOverlapIsEndpointJoin = (
    first: TraceSegment,
    second: TraceSegment,
    copperContactDistance: number,
  ): boolean => {
    const firstEndpoints = endpointsByTraceId.get(first.traceId) ?? []
    const secondEndpoints = endpointsByTraceId.get(second.traceId) ?? []
    const segmentsIntersect = doSegmentsIntersect(
      first.start,
      first.end,
      second.start,
      second.end,
    )
    for (const firstEndpoint of firstEndpoints) {
      for (const secondEndpoint of secondEndpoints) {
        if (!pointsMatch(firstEndpoint, secondEndpoint)) continue
        const firstTouchesEndpoint =
          pointsMatch(first.start, firstEndpoint) ||
          pointsMatch(first.end, firstEndpoint)
        const secondTouchesEndpoint =
          pointsMatch(second.start, secondEndpoint) ||
          pointsMatch(second.end, secondEndpoint)
        if (
          firstTouchesEndpoint &&
          secondTouchesEndpoint &&
          segmentsMeetOnlyAtSharedEndpoint(first, second)
        ) {
          return true
        }
        if (
          !segmentsIntersect &&
          pointToSegmentDistance(firstEndpoint, first.start, first.end) <=
            copperContactDistance + GEOMETRY_EPSILON &&
          pointToSegmentDistance(secondEndpoint, second.start, second.end) <=
            copperContactDistance + GEOMETRY_EPSILON
        ) {
          return true
        }
      }
    }
    return false
  }

  const traceHasEndpointAt = (traceId: string, point: BoardPoint) =>
    (endpointsByTraceId.get(traceId) ?? []).some((endpoint) =>
      pointsMatch(endpoint, point),
    )

  const sameNetSegmentViaIsEndpointJoin = (
    segment: TraceSegment,
    via: TraceVia,
  ) => {
    if (!segmentTouchesViaOnlyAtEndpoint(segment, via)) return false
    if (segment.traceId === via.traceId) return true
    return (
      traceHasEndpointAt(segment.traceId, via.center) &&
      traceHasEndpointAt(via.traceId, via.center)
    )
  }

  const sameNetViaViaIsEndpointJoin = (first: TraceVia, second: TraceVia) => {
    if (!pointsMatch(first.center, second.center)) return false
    if (first.traceId === second.traceId) return true
    return (
      traceHasEndpointAt(first.traceId, first.center) &&
      traceHasEndpointAt(second.traceId, second.center)
    )
  }

  if (bounds) {
    for (const segment of mutableSegments) {
      const inset = segment.width / 2
      if (
        !pointIsInsideBounds(segment.start, bounds, inset) ||
        !pointIsInsideBounds(segment.end, bounds, inset)
      ) {
        violations.push({
          code: "outside_bounds",
          traceId: segment.traceId,
          connectionName: segment.connectionName,
          layer: segment.layer,
        })
      }
    }
    for (const via of mutableVias) {
      if (!pointIsInsideBounds(via.center, bounds, via.diameter / 2)) {
        violations.push({
          code: "outside_bounds",
          traceId: via.traceId,
          connectionName: via.connectionName,
        })
      }
    }
  }

  const checkSegmentViaClearance = (
    segment: TraceSegment,
    via: TraceVia,
    primary: "segment" | "via" = "segment",
  ): void => {
    if (!viaUsesLayer(via, segment.layer)) return
    const measuredDistance = pointToSegmentDistance(
      via.center,
      segment.start,
      segment.end,
    )
    const sameConnection = segment.connectionName === via.connectionName
    const requiredDistance =
      via.diameter / 2 + segment.width / 2 + (sameConnection ? 0 : viaClearance)
    if (measuredDistance >= requiredDistance - GEOMETRY_EPSILON) return
    if (sameConnection && sameNetSegmentViaIsEndpointJoin(segment, via)) return
    violations.push({
      code: sameConnection
        ? "same_net_overlap_outside_endpoint"
        : "different_net_trace_via_clearance",
      traceId: primary === "segment" ? segment.traceId : via.traceId,
      connectionName:
        primary === "segment" ? segment.connectionName : via.connectionName,
      otherTraceId: primary === "segment" ? via.traceId : segment.traceId,
      otherConnectionName:
        primary === "segment" ? via.connectionName : segment.connectionName,
      layer: segment.layer,
      measuredDistance,
      requiredDistance,
    })
  }

  const checkViaViaClearance = (first: TraceVia, second: TraceVia): void => {
    if (!viasShareLayer(first, second)) return
    const measuredDistance = distance(first.center, second.center)
    const sameConnection = first.connectionName === second.connectionName
    const requiredDistance =
      first.diameter / 2 +
      second.diameter / 2 +
      (sameConnection ? 0 : viaClearance)
    if (measuredDistance >= requiredDistance - GEOMETRY_EPSILON) return
    if (sameConnection && sameNetViaViaIsEndpointJoin(first, second)) return
    violations.push({
      code: sameConnection
        ? "same_net_overlap_outside_endpoint"
        : "different_net_via_via_clearance",
      traceId: first.traceId,
      connectionName: first.connectionName,
      otherTraceId: second.traceId,
      otherConnectionName: second.connectionName,
      measuredDistance,
      requiredDistance,
    })
  }

  for (let firstIndex = 0; firstIndex < mutableSegments.length; firstIndex++) {
    const first = mutableSegments[firstIndex]!
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < mutableSegments.length;
      secondIndex++
    ) {
      const second = mutableSegments[secondIndex]!
      if (first.layer !== second.layer) continue
      if (first.traceId === second.traceId) {
        if (Math.abs(first.segmentIndex - second.segmentIndex) <= 1) continue
        const measuredDistance = segmentToSegmentMinDistance(
          first.start,
          first.end,
          second.start,
          second.end,
        )
        const requiredDistance = first.width / 2 + second.width / 2
        if (measuredDistance < requiredDistance - GEOMETRY_EPSILON) {
          violations.push({
            code: doSegmentsIntersect(
              first.start,
              first.end,
              second.start,
              second.end,
            )
              ? "self_intersection"
              : "self_trace_clearance",
            traceId: first.traceId,
            connectionName: first.connectionName,
            layer: first.layer,
            measuredDistance,
            requiredDistance,
          })
        }
        continue
      }
      const measuredDistance = segmentToSegmentMinDistance(
        first.start,
        first.end,
        second.start,
        second.end,
      )
      if (first.connectionName === second.connectionName) {
        const requiredDistance = first.width / 2 + second.width / 2
        if (
          measuredDistance < requiredDistance - GEOMETRY_EPSILON &&
          !sameNetOverlapIsEndpointJoin(first, second, requiredDistance)
        ) {
          violations.push({
            code: "same_net_overlap_outside_endpoint",
            traceId: first.traceId,
            connectionName: first.connectionName,
            otherTraceId: second.traceId,
            otherConnectionName: second.connectionName,
            layer: first.layer,
            measuredDistance,
            requiredDistance,
          })
        }
        continue
      }
      const requiredDistance =
        first.width / 2 + second.width / 2 + traceClearance
      if (measuredDistance < requiredDistance - GEOMETRY_EPSILON) {
        violations.push({
          code: "different_net_trace_clearance",
          traceId: first.traceId,
          connectionName: first.connectionName,
          otherTraceId: second.traceId,
          otherConnectionName: second.connectionName,
          layer: first.layer,
          measuredDistance,
          requiredDistance,
        })
      }
    }
  }

  for (const mutableSegment of mutableSegments) {
    for (const immutableSegment of immutableSegments) {
      if (mutableSegment.layer !== immutableSegment.layer) continue
      const measuredDistance = segmentToSegmentMinDistance(
        mutableSegment.start,
        mutableSegment.end,
        immutableSegment.start,
        immutableSegment.end,
      )
      if (mutableSegment.connectionName === immutableSegment.connectionName) {
        const requiredDistance =
          mutableSegment.width / 2 + immutableSegment.width / 2
        if (
          measuredDistance < requiredDistance - GEOMETRY_EPSILON &&
          !sameNetOverlapIsEndpointJoin(
            mutableSegment,
            immutableSegment,
            requiredDistance,
          )
        ) {
          violations.push({
            code: "same_net_overlap_outside_endpoint",
            traceId: mutableSegment.traceId,
            connectionName: mutableSegment.connectionName,
            otherTraceId: immutableSegment.traceId,
            otherConnectionName: immutableSegment.connectionName,
            layer: mutableSegment.layer,
            measuredDistance,
            requiredDistance,
          })
        }
        continue
      }
      const requiredDistance =
        mutableSegment.width / 2 + immutableSegment.width / 2 + traceClearance
      if (measuredDistance < requiredDistance - GEOMETRY_EPSILON) {
        violations.push({
          code: "different_net_trace_clearance",
          traceId: mutableSegment.traceId,
          connectionName: mutableSegment.connectionName,
          otherTraceId: immutableSegment.traceId,
          otherConnectionName: immutableSegment.connectionName,
          layer: mutableSegment.layer,
          measuredDistance,
          requiredDistance,
        })
      }
    }
    for (const immutableVia of immutableVias) {
      checkSegmentViaClearance(mutableSegment, immutableVia)
    }
  }

  for (const mutableVia of mutableVias) {
    for (const mutableSegment of mutableSegments) {
      checkSegmentViaClearance(mutableSegment, mutableVia)
    }
    for (const immutableSegment of immutableSegments) {
      checkSegmentViaClearance(immutableSegment, mutableVia, "via")
    }
    for (const immutableVia of immutableVias) {
      checkViaViaClearance(mutableVia, immutableVia)
    }
  }

  for (let firstIndex = 0; firstIndex < mutableVias.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < mutableVias.length;
      secondIndex++
    ) {
      checkViaViaClearance(mutableVias[firstIndex]!, mutableVias[secondIndex]!)
    }
  }
  return violations
}

const createMeanderCandidate = ({
  trace,
  segmentRouteIndex,
  targetAddedLength,
  toothCount,
  normalSign,
  placementFraction,
  flatLength,
  gapLength,
  leadLength,
  tailLength,
}: {
  trace: SimplifiedPcbTrace
  segmentRouteIndex: number
  targetAddedLength: number
  toothCount: number
  normalSign: -1 | 1
  placementFraction: number
  flatLength: number
  gapLength: number
  leadLength: number
  tailLength: number
}): SimplifiedPcbTrace | null => {
  const start = trace.route[segmentRouteIndex]
  const end = trace.route[segmentRouteIndex + 1]
  if (start?.route_type !== "wire" || end?.route_type !== "wire") return null
  if (start.layer !== end.layer) return null
  const segmentLength = distance(start, end)
  if (segmentLength <= GEOMETRY_EPSILON) return null
  if (!isOctilinearSegment(start, end)) return null
  const tangent = {
    x: (end.x - start.x) / segmentLength,
    y: (end.y - start.y) / segmentLength,
  }
  const normal = {
    x: -tangent.y * normalSign,
    y: tangent.x * normalSign,
  }
  const amplitude = targetAddedLength / (2 * toothCount * (Math.SQRT2 - 1))
  // The two 45-degree legs on either side of a flat/gap have a minimum
  // centerline separation of spacing / sqrt(2). Keep their copper disjoint so
  // the geometric length does not count copper that has merged with itself.
  const minimumFoldSpacing = start.width * Math.SQRT2 + GEOMETRY_EPSILON
  const effectiveFlatLength = Math.max(flatLength, minimumFoldSpacing)
  const effectiveGapLength = Math.max(gapLength, minimumFoldSpacing)
  const occupiedLength =
    toothCount * (2 * amplitude + effectiveFlatLength) +
    Math.max(0, toothCount - 1) * effectiveGapLength
  if (occupiedLength + leadLength + tailLength > segmentLength) return null
  const movableLength = segmentLength - occupiedLength - leadLength - tailLength
  const leadingLength = leadLength + movableLength * placementFraction
  const add = (
    point: BoardPoint,
    tangentDistance: number,
    normalDistance: number,
  ): BoardPoint => ({
    x: point.x + tangent.x * tangentDistance + normal.x * normalDistance,
    y: point.y + tangent.y * tangentDistance + normal.y * normalDistance,
  })
  let cursor: BoardPoint = add(start, leadingLength, 0)
  const replacementPoints: BoardPoint[] = [{ x: start.x, y: start.y }, cursor]
  for (let toothIndex = 0; toothIndex < toothCount; toothIndex++) {
    cursor = add(cursor, amplitude, amplitude)
    replacementPoints.push(cursor)
    cursor = add(cursor, effectiveFlatLength, 0)
    replacementPoints.push(cursor)
    cursor = add(cursor, amplitude, -amplitude)
    replacementPoints.push(cursor)
    if (toothIndex < toothCount - 1) {
      cursor = add(cursor, effectiveGapLength, 0)
      replacementPoints.push(cursor)
    }
  }
  replacementPoints.push({ x: end.x, y: end.y })
  const replacementRoute: WireRoutePoint[] = replacementPoints
    .filter(
      (point, pointIndex, points) =>
        pointIndex === 0 || !pointsMatch(point, points[pointIndex - 1]!),
    )
    .map((point, pointIndex, points) => {
      if (pointIndex === 0) return { ...start }
      if (pointIndex === points.length - 1) return { ...end }
      return {
        route_type: "wire",
        x: point.x,
        y: point.y,
        width: start.width,
        layer: start.layer,
      }
    })
  const route = [
    ...trace.route.slice(0, segmentRouteIndex),
    ...replacementRoute,
    ...trace.route.slice(segmentRouteIndex + 2),
  ]
  return { ...cloneTrace(trace), route }
}

const findMeanderedTrace = ({
  trace,
  targetAddedLength,
  traces,
  immutableTraces,
  immutableTraceConnectionNameByPcbTraceId,
  traceClearance,
  viaClearance,
  viaDiameterFallback,
  maxMeanderAmplitude,
  flatLength,
  gapLength,
  leadLength,
  tailLength,
  bounds,
}: {
  trace: SimplifiedPcbTrace
  targetAddedLength: number
  traces: readonly SimplifiedPcbTrace[]
  immutableTraces: readonly SimplifiedPcbTrace[]
  immutableTraceConnectionNameByPcbTraceId?: ReadonlyMap<
    string,
    SrjConnectionName
  >
  traceClearance: number
  viaClearance: number
  viaDiameterFallback?: number
  maxMeanderAmplitude: number
  flatLength: number
  gapLength: number
  leadLength: number
  tailLength: number
  bounds?: SimpleRouteBounds
}): { trace: SimplifiedPcbTrace; toothCount: number } | null => {
  const minimumToothCount = Math.max(
    1,
    Math.ceil(targetAddedLength / (2 * (Math.SQRT2 - 1) * maxMeanderAmplitude)),
  )
  const eligibleSegmentIndexes = trace.route
    .slice(0, -1)
    .map((routePoint, segmentRouteIndex) => ({
      routePoint,
      nextRoutePoint: trace.route[segmentRouteIndex + 1],
      segmentRouteIndex,
    }))
    .filter(
      ({ routePoint, nextRoutePoint }) =>
        routePoint.route_type === "wire" &&
        nextRoutePoint?.route_type === "wire" &&
        routePoint.layer === nextRoutePoint.layer &&
        isOctilinearSegment(routePoint, nextRoutePoint),
    )
    .toSorted((first, second) => {
      const lengthDifference =
        distance(
          second.routePoint as BoardPoint,
          second.nextRoutePoint as BoardPoint,
        ) -
        distance(
          first.routePoint as BoardPoint,
          first.nextRoutePoint as BoardPoint,
        )
      if (Math.abs(lengthDifference) > GEOMETRY_EPSILON) {
        return lengthDifference
      }
      const firstIsFinal = first.segmentRouteIndex === trace.route.length - 2
      const secondIsFinal = second.segmentRouteIndex === trace.route.length - 2
      if (firstIsFinal !== secondIsFinal) return firstIsFinal ? -1 : 1
      return second.segmentRouteIndex - first.segmentRouteIndex
    })

  for (
    let toothCount = minimumToothCount;
    toothCount <= minimumToothCount + 16;
    toothCount++
  ) {
    for (const { segmentRouteIndex } of eligibleSegmentIndexes) {
      for (const placementFraction of [0, 0.5, 1, 0.25, 0.75]) {
        for (const normalSign of [1, -1] as const) {
          const candidate = createMeanderCandidate({
            trace,
            segmentRouteIndex,
            targetAddedLength,
            toothCount,
            normalSign,
            placementFraction,
            flatLength,
            gapLength,
            leadLength,
            tailLength,
          })
          if (!candidate) continue
          const actualAddedLength =
            getPlanarTraceLength(candidate) - getPlanarTraceLength(trace)
          if (
            Math.abs(actualAddedLength - targetAddedLength) > GEOMETRY_EPSILON
          ) {
            continue
          }
          const candidateTraces = traces.map((existingTrace) =>
            existingTrace.pcb_trace_id === trace.pcb_trace_id
              ? candidate
              : existingTrace,
          )
          const violations = getTraceBundleClearanceViolations({
            traces: candidateTraces,
            immutableTraces,
            immutableTraceConnectionNameByPcbTraceId,
            traceClearance,
            viaClearance,
            viaDiameterFallback,
            bounds,
          })
          if (violations.length > 0) continue
          return { trace: candidate, toothCount }
        }
      }
    }
  }
  return null
}

/**
 * Converts orthogonal bundle corners to 45-degree geometry, then adds exact
 * 45-degree trapezoid meanders to shorter routes. Every accepted candidate is
 * rechecked against all mutable routes, existing copper, vias, and bounds.
 */
export const postprocessOrthogonalTraceBundle = ({
  traces,
  immutableTraces = [],
  immutableTraceConnectionNameByPcbTraceId,
  fixedLengthByConnectionName = new Map<SrjConnectionName, number>(),
  lengthMatchGroups = [],
  chamfer = 0.1,
  traceClearance = 0.1,
  viaClearance = 0.05,
  viaDiameterFallback,
  maxMeanderAmplitude = 0.11,
  meanderFlatLength = 0.04,
  meanderGapLength = 0.04,
  meanderLeadLength = 0.05,
  meanderTailLength = 0.1,
  bounds,
}: PostprocessOrthogonalTraceBundleParams): PostprocessOrthogonalTraceBundleResult => {
  const nonNegativeGeometryParameters = [
    ["chamfer", chamfer],
    ["meanderFlatLength", meanderFlatLength],
    ["meanderGapLength", meanderGapLength],
    ["meanderLeadLength", meanderLeadLength],
    ["meanderTailLength", meanderTailLength],
  ] as const
  for (const [name, value] of nonNegativeGeometryParameters) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be finite and non-negative`)
    }
  }
  if (!Number.isFinite(maxMeanderAmplitude) || maxMeanderAmplitude <= 0) {
    throw new Error("maxMeanderAmplitude must be finite and positive")
  }

  const seenLengthMatchConnections = new Set<SrjConnectionName>()
  for (const group of lengthMatchGroups) {
    if (!Number.isFinite(group.maxSkew) || group.maxSkew < 0) {
      throw new Error("Length-match maxSkew must be finite and non-negative")
    }
    for (const connectionName of group.connectionNames) {
      if (seenLengthMatchConnections.has(connectionName)) {
        throw new Error(
          `Length-match connection ${connectionName} appears in more than one group`,
        )
      }
      seenLengthMatchConnections.add(connectionName)
    }
  }

  let processedTraces = traces.map((trace) =>
    chamferOrthogonalTrace(trace, chamfer),
  )
  for (const trace of processedTraces) assertTraceIsOctilinear(trace)

  const initialViolations = getTraceBundleClearanceViolations({
    traces: processedTraces,
    immutableTraces,
    immutableTraceConnectionNameByPcbTraceId,
    traceClearance,
    viaClearance,
    viaDiameterFallback,
    bounds,
  })
  if (initialViolations.length > 0) {
    throw new Error(
      `45-degree chamfering produced ${initialViolations.length} clearance violation(s)`,
    )
  }

  const diagnostics: TraceLengthMatchDiagnostic[] = []
  for (const group of lengthMatchGroups) {
    const traceByConnectionName = new Map(
      processedTraces.map((trace) => [getTraceConnectionName(trace), trace]),
    )
    const groupTraces = group.connectionNames.map((connectionName) => {
      const trace = traceByConnectionName.get(connectionName)
      if (!trace) {
        throw new Error(
          `Missing trace for length-match connection ${connectionName}`,
        )
      }
      return trace
    })
    if (groupTraces.length < 2) continue
    const getTotalLength = (trace: SimplifiedPcbTrace) => {
      const connectionName = getTraceConnectionName(trace)
      return (
        (fixedLengthByConnectionName.get(connectionName) ?? 0) +
        getPlanarTraceLength(trace)
      )
    }
    const beforeLengths = groupTraces.map(getTotalLength)
    const beforeSkew = Math.max(...beforeLengths) - Math.min(...beforeLengths)
    const targetLength = Math.max(...beforeLengths)
    const addedLengthByConnectionName = new Map<SrjConnectionName, number>()
    const meanderToothCountByConnectionName = new Map<
      SrjConnectionName,
      number
    >()

    if (beforeSkew > group.maxSkew + GEOMETRY_EPSILON) {
      const tracesByDescendingDeficit = groupTraces
        .map((trace) => ({
          trace,
          deficit: targetLength - getTotalLength(trace),
        }))
        .filter(({ deficit }) => deficit > GEOMETRY_EPSILON)
        .toSorted((first, second) => second.deficit - first.deficit)
      for (const { trace, deficit } of tracesByDescendingDeficit) {
        const currentTrace = processedTraces.find(
          (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
        )!
        const meandered = findMeanderedTrace({
          trace: currentTrace,
          targetAddedLength: deficit,
          traces: processedTraces,
          immutableTraces,
          immutableTraceConnectionNameByPcbTraceId,
          traceClearance,
          viaClearance,
          viaDiameterFallback,
          maxMeanderAmplitude,
          flatLength: meanderFlatLength,
          gapLength: meanderGapLength,
          leadLength: meanderLeadLength,
          tailLength: meanderTailLength,
          bounds,
        })
        const connectionName = getTraceConnectionName(currentTrace)
        if (!meandered) {
          throw new Error(
            `Could not add ${deficit.toFixed(6)}mm to ${connectionName} without a clearance violation`,
          )
        }
        processedTraces = processedTraces.map((candidate) =>
          candidate.pcb_trace_id === currentTrace.pcb_trace_id
            ? meandered.trace
            : candidate,
        )
        addedLengthByConnectionName.set(connectionName, deficit)
        meanderToothCountByConnectionName.set(
          connectionName,
          meandered.toothCount,
        )
      }
    }

    const finalTraceByConnectionName = new Map(
      processedTraces.map((trace) => [getTraceConnectionName(trace), trace]),
    )
    const afterLengths = group.connectionNames.map((connectionName) =>
      getTotalLength(finalTraceByConnectionName.get(connectionName)!),
    )
    const afterSkew = Math.max(...afterLengths) - Math.min(...afterLengths)
    if (afterSkew > group.maxSkew + GEOMETRY_EPSILON) {
      throw new Error(
        `Length matching left ${afterSkew.toFixed(6)}mm skew for ${group.connectionNames.join(", ")}`,
      )
    }
    diagnostics.push({
      connectionNames: group.connectionNames,
      beforeSkew,
      afterSkew,
      addedLengthByConnectionName,
      meanderToothCountByConnectionName,
    })
  }

  for (const trace of processedTraces) assertTraceIsOctilinear(trace)
  const clearanceViolations = getTraceBundleClearanceViolations({
    traces: processedTraces,
    immutableTraces,
    immutableTraceConnectionNameByPcbTraceId,
    traceClearance,
    viaClearance,
    viaDiameterFallback,
    bounds,
  })
  if (clearanceViolations.length > 0) {
    throw new Error(
      `Post-processing produced ${clearanceViolations.length} clearance violation(s)`,
    )
  }
  return {
    traces: processedTraces,
    lengthMatchDiagnostics: diagnostics,
    clearanceViolations,
  }
}
