import type { Point } from "@tscircuit/math-utils"
import type {
  CircuitJson,
  PcbBoard,
  PcbPort,
  PcbStackup,
  PcbTrace,
  SourceBus,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import { findCoupledRuns } from "./find-coupled-runs"
import { isNegativeRouteReversed } from "./is-negative-route-reversed"
import { type CoupledRun, MIN_OVERLAP } from "./select-coupled-runs"
import type {
  LocalSkewSegment,
  PcbDifferentialPairLocalSkew,
} from "./pcb-differential-pair-local-skew"
import {
  type TraceStep,
  type TraceWalk,
  reverseWalk,
  walkTrace,
} from "./walk-trace"

// Use KiCad's fixed fallback colours until a differential-pair prop exists.
const POSITIVE_SKEW_COLOR = "rgb(0, 0, 255)"
const NEGATIVE_SKEW_COLOR = "rgb(255, 0, 0)"

/** Target maximum sample length along a skew ramp, in mm. */
const SAMPLE_LENGTH = 0.05

/** Ramps are not cut finer than this change in skew, in mm (1 µm, the readout precision). */
const SKEW_STEP = 0.001

/** Skew is rounded to 1/this mm (10 nm), to suppress floating-point noise. */
const SKEW_ROUNDING = 1e5

/** Coordinates and widths beyond this many mm (10 m) are corrupt; such pairs are skipped. */
const MAX_COORDINATE = 1e4

type SkewScale = { positive: number; negative: number }
type SkewCoupling = LocalSkewSegment["coupling"]
type SubcircuitId = NonNullable<SourceBus["subcircuit_id"]>
type PcbPortId = PcbPort["pcb_port_id"]
type SourcePortId = SourcePort["source_port_id"]

/** A stretch of one trace with skew changing linearly from `startSkew` to `endSkew`. */
type SkewSpan = {
  from: number
  to: number
  startSkew: number | null
  endSkew: number | null
  coupling: SkewCoupling
}

/** Routed copper grouped by the source trace it belongs to. */
type TracesBySource = Map<SourceTrace["source_trace_id"], PcbTrace[]>

/**
 * Computes local skew along every routed differential pair: at each point,
 * how much farther one trace has run than the other, not only at the ends.
 *
 * Distances are copper length (planar length plus each via's Z-distance
 * between layers). Each trace with exactly one end port marked `is_output`
 * is walked from that end; if only one trace has such a port, the other is
 * oriented to match it by end distance; if neither does, distances are
 * measured from the positive trace's first route point and the negative
 * trace is walked from the end that matches it.
 */
export function computeLocalSkew(
  circuitJson: CircuitJson,
  onPairError: (bus: SourceBus) => void,
): PcbDifferentialPairLocalSkew[] {
  const tracesBySource: TracesBySource = new Map()
  const pcbPortsById = new Map<PcbPortId, PcbPort>()
  const sourcePortsById = new Map<SourcePortId, SourcePort>()
  const boards: PcbBoard[] = []
  const parentBySubcircuit = new Map<SubcircuitId, SubcircuitId>()
  const boardsBySubcircuit = new Map<SubcircuitId, PcbBoard>()
  const stackupsByBoard = new Map<PcbBoard["pcb_board_id"], PcbStackup>()
  for (const element of circuitJson) {
    if (element.type === "pcb_board") {
      boards.push(element)
      if (element.subcircuit_id !== undefined) {
        boardsBySubcircuit.set(element.subcircuit_id, element)
      }
      continue
    }
    if (
      element.type === "source_group" &&
      element.subcircuit_id !== undefined &&
      element.parent_subcircuit_id !== undefined
    ) {
      parentBySubcircuit.set(
        element.subcircuit_id,
        element.parent_subcircuit_id,
      )
      continue
    }
    if (element.type === "pcb_stackup") {
      stackupsByBoard.set(element.pcb_board_id, element)
      continue
    }
    if (element.type === "pcb_port") {
      pcbPortsById.set(element.pcb_port_id, element)
      continue
    }
    if (element.type === "source_port") {
      sourcePortsById.set(element.source_port_id, element)
      continue
    }
    if (element.type !== "pcb_trace") continue
    if (element.source_trace_id === undefined) continue
    const traces = tracesBySource.get(element.source_trace_id) ?? []
    traces.push(element)
    tracesBySource.set(element.source_trace_id, traces)
  }

  const findBoard = (
    subcircuitId: SubcircuitId | undefined,
  ): PcbBoard | undefined => {
    if (boards.length === 1) return boards[0]
    const visited = new Set<SubcircuitId>()
    while (subcircuitId !== undefined && !visited.has(subcircuitId)) {
      const board = boardsBySubcircuit.get(subcircuitId)
      if (board) return board
      visited.add(subcircuitId)
      subcircuitId = parentBySubcircuit.get(subcircuitId)
    }
    return undefined
  }

  const pairs: PcbDifferentialPairLocalSkew[] = []
  for (const element of circuitJson) {
    if (element.type !== "source_bus") continue
    try {
      const pair = computePairSkew({
        bus: element,
        tracesBySource,
        pcbPortsById,
        sourcePortsById,
        findBoard,
        stackupsByBoard,
      })
      if (pair) pairs.push(pair)
    } catch {
      // A failed pair must not hide skew on the rest of the board.
      onPairError(element)
    }
  }
  return pairs
}

/**
 * Local skew for one differential pair. Null when the bus isn't a pair of
 * two different traces each routed as one pcb_trace (the order of split
 * pieces along the signal isn't recorded), or when a route is empty or has
 * non-finite or absurd geometry.
 */
function computePairSkew({
  bus,
  tracesBySource,
  pcbPortsById,
  sourcePortsById,
  findBoard,
  stackupsByBoard,
}: {
  bus: SourceBus
  tracesBySource: TracesBySource
  pcbPortsById: Map<PcbPortId, PcbPort>
  sourcePortsById: Map<SourcePortId, SourcePort>
  findBoard: (subcircuitId: SubcircuitId | undefined) => PcbBoard | undefined
  stackupsByBoard: Map<PcbBoard["pcb_board_id"], PcbStackup>
}): PcbDifferentialPairLocalSkew | null {
  const differentialPair = bus.differential_pair
  if (!differentialPair) return null
  const positiveId = differentialPair.positive_source_trace_id
  const negativeId = differentialPair.negative_source_trace_id
  if (positiveId === negativeId) return null

  const positiveTraces = tracesBySource.get(positiveId) ?? []
  const negativeTraces = tracesBySource.get(negativeId) ?? []
  if (positiveTraces.length !== 1 || negativeTraces.length !== 1) return null
  const positiveTrace = positiveTraces[0]
  const negativeTrace = negativeTraces[0]

  const subcircuitId =
    positiveTrace.subcircuit_id ??
    negativeTrace.subcircuit_id ??
    bus.subcircuit_id
  const board = findBoard(subcircuitId)
  const stackup = board ? stackupsByBoard.get(board.pcb_board_id) : undefined
  const boardThickness = board?.thickness

  let positive = walkTrace({
    trace: positiveTrace,
    stackup,
    boardThickness,
  })
  if (!isMeasurable(positive)) return null
  let negative = walkTrace({
    trace: negativeTrace,
    stackup,
    boardThickness,
  })
  if (!isMeasurable(negative)) return null
  const positiveOutput = outputEnd({
    trace: positiveTrace,
    pcbPortsById,
    sourcePortsById,
  })
  const negativeOutput = outputEnd({
    trace: negativeTrace,
    pcbPortsById,
    sourcePortsById,
  })
  if (positiveOutput === "end") positive = reverseWalk(positive)
  if (negativeOutput === "end") negative = reverseWalk(negative)
  if (
    (!positiveOutput || !negativeOutput) &&
    isNegativeRouteReversed({
      positiveSteps: positive.steps,
      negativeSteps: negative.steps,
    })
  ) {
    if (negativeOutput) {
      positive = reverseWalk(positive)
    } else {
      negative = reverseWalk(negative)
    }
  }
  const runs = findCoupledRuns({
    positive: positive.steps,
    negative: negative.steps,
    traceGap: differentialPair.trace_gap,
  })

  const positiveTrack = skewSpans({
    runs,
    side: "positive",
    steps: positive.steps,
    partnerSteps: negative.steps,
    length: positive.length,
  })
  const negativeTrack = skewSpans({
    runs,
    side: "negative",
    steps: negative.steps,
    partnerSteps: positive.steps,
    length: negative.length,
  })

  return {
    type: "pcb_differential_pair_local_skew",
    pcb_differential_pair_local_skew_id: `pcb_differential_pair_local_skew_${bus.source_bus_id}`,
    source_bus_id: bus.source_bus_id,
    ...(bus.subcircuit_id !== undefined && {
      subcircuit_id: bus.subcircuit_id,
    }),
    ...(bus.max_length_skew !== undefined && {
      max_length_skew: bus.max_length_skew,
    }),
    ...(runs.length > 0 && {
      max_local_skew: Math.max(
        positiveTrack.scale.positive,
        positiveTrack.scale.negative,
        negativeTrack.scale.positive,
        negativeTrack.scale.negative,
      ),
    }),
    positive_skew_color: POSITIVE_SKEW_COLOR,
    negative_skew_color: NEGATIVE_SKEW_COLOR,
    positive: {
      pcb_trace_id: positiveTrace.pcb_trace_id,
      positive_skew_scale: positiveTrack.scale.positive,
      negative_skew_scale: positiveTrack.scale.negative,
      segments: sampleSkew({
        steps: positive.steps,
        spans: positiveTrack.spans,
      }),
    },
    negative: {
      pcb_trace_id: negativeTrace.pcb_trace_id,
      positive_skew_scale: negativeTrack.scale.positive,
      negative_skew_scale: negativeTrack.scale.negative,
      segments: sampleSkew({
        steps: negative.steps,
        spans: negativeTrack.spans,
      }),
    },
  }
}

/**
 * Which end of `trace` is connected to an output port (`source_port.is_output`),
 * or null unless exactly one end port is an output.
 */
function outputEnd({
  trace,
  pcbPortsById,
  sourcePortsById,
}: {
  trace: PcbTrace
  pcbPortsById: Map<PcbPortId, PcbPort>
  sourcePortsById: Map<SourcePortId, SourcePort>
}): "start" | "end" | null {
  let startPortId: PcbPortId | undefined
  let endPortId: PcbPortId | undefined
  for (const point of trace.route) {
    if (point.route_type !== "wire") continue
    if (startPortId === undefined && point.start_pcb_port_id !== undefined) {
      startPortId = point.start_pcb_port_id
    }
    if (point.end_pcb_port_id !== undefined) {
      endPortId = point.end_pcb_port_id
    }
  }
  const isOutput = (pcbPortId: PcbPortId | undefined): boolean => {
    if (pcbPortId === undefined) return false
    const pcbPort = pcbPortsById.get(pcbPortId)
    if (!pcbPort) return false
    return sourcePortsById.get(pcbPort.source_port_id)?.is_output === true
  }
  const startIsOutput = isOutput(startPortId)
  const endIsOutput = isOutput(endPortId)
  if (startIsOutput === endIsOutput) return null
  return startIsOutput ? "start" : "end"
}

/** True when a walk has copper, a finite length, and every coordinate and width within {@link MAX_COORDINATE}. */
function isMeasurable(walk: TraceWalk): boolean {
  if (walk.steps.length === 0 || !Number.isFinite(walk.length)) return false
  return walk.steps.every((step) =>
    [step.start.x, step.start.y, step.end.x, step.end.y, step.width].every(
      (value) => Math.abs(value) <= MAX_COORDINATE,
    ),
  )
}

/**
 * Covers one whole trace with spans: unknown before the first coupled run
 * and after the last, coupled runs as measured, and interpolated between
 * consecutive runs. When a coupled run begins or ends right at a via, the
 * via length steps at the via instead of ramping across the uncoupled
 * stretch, and the via endpoint is recorded in the trace's per-sign scale
 * even before the first run or after the last. The negative side reports the
 * negated skew.
 */
function skewSpans({
  runs,
  side,
  steps,
  partnerSteps,
  length: totalLength,
}: {
  runs: CoupledRun[]
  side: "positive" | "negative"
  steps: TraceStep[]
  partnerSteps: TraceStep[]
  /** The trace's walk length, in mm. */
  length: number
}): { spans: SkewSpan[]; scale: SkewScale } {
  const coupled = runs
    .map((run) => {
      const from = side === "positive" ? run.positiveStart : run.negativeStart
      const to = side === "positive" ? run.positiveEnd : run.negativeEnd
      const otherFrom =
        side === "positive" ? run.negativeStart : run.positiveStart
      const otherTo = side === "positive" ? run.negativeEnd : run.positiveEnd
      return {
        from,
        to,
        otherFrom,
        otherTo,
        startSkew: from - otherFrom,
        endSkew: to - otherTo,
        startVia: viaAt({
          steps,
          distance: from,
          edge: "start",
        }),
        endVia: viaAt({
          steps,
          distance: to,
          edge: "end",
        }),
        otherStartVia: viaAt({
          steps: partnerSteps,
          distance: otherFrom,
          edge: "start",
        }),
        otherEndVia: viaAt({
          steps: partnerSteps,
          distance: otherTo,
          edge: "end",
        }),
      }
    })
    .sort((a, b) => a.from - b.from)

  if (coupled.length === 0) {
    return {
      spans: [unknownSpan({ from: 0, to: totalLength })],
      scale: { positive: 0, negative: 0 },
    }
  }
  let positive = 0
  let negative = 0
  const record = (value: number): void => {
    const rounded = roundSkew(value)
    if (rounded > positive) positive = rounded
    if (-rounded > negative) negative = -rounded
  }

  const spans: SkewSpan[] = []
  const first = coupled[0]
  if (first.startVia > 0 || first.otherStartVia > 0) {
    record(first.startSkew - first.startVia + first.otherStartVia)
  }
  // Gaps under MIN_OVERLAP are rounding at shared corners, not stretches.
  if (first.from > MIN_OVERLAP) {
    spans.push(unknownSpan({ from: 0, to: first.from }))
  }
  coupled.forEach((run, index) => {
    const previous = coupled[index - 1]
    if (previous) {
      const gapFrom = previous.to + previous.endVia
      const gapTo = run.from - run.startVia
      if (gapTo - gapFrom > MIN_OVERLAP) {
        const afterPrevious =
          previous.endSkew + previous.endVia - previous.otherEndVia
        const partnerHasCopperGap =
          run.otherFrom - (previous.otherTo + previous.otherEndVia) >
          MIN_OVERLAP
        // If the partner had only a single via between the two runs, that via
        // was already accounted for at `previous.otherEndVia`.
        const otherStartVia = partnerHasCopperGap ? run.otherStartVia : 0
        const beforeRun = run.startSkew - run.startVia + otherStartVia
        record(afterPrevious)
        record(beforeRun)
        spans.push({
          from: gapFrom,
          to: gapTo,
          startSkew: afterPrevious,
          endSkew: beforeRun,
          coupling: "interpolated",
        })
      }
    }
    record(run.startSkew)
    record(run.endSkew)
    spans.push({
      from: run.from,
      to: run.to,
      startSkew: run.startSkew,
      endSkew: run.endSkew,
      coupling: "coupled",
    })
  })
  const last = coupled[coupled.length - 1]
  if (last.endVia > 0 || last.otherEndVia > 0) {
    record(last.endSkew + last.endVia - last.otherEndVia)
  }
  if (totalLength - last.to > MIN_OVERLAP) {
    spans.push(unknownSpan({ from: last.to, to: totalLength }))
  }
  return { spans, scale: { positive, negative } }
}

/** Length of any via directly before the start or after the end of a step at `distance`, in mm. */
function viaAt({
  steps,
  distance,
  edge,
}: {
  steps: TraceStep[]
  distance: number
  edge: "start" | "end"
}): number {
  const position = (step: TraceStep) =>
    edge === "start" ? step.startDistance : step.startDistance + step.length
  const viaLength = (step: TraceStep) =>
    edge === "start" ? step.startViaLength : step.endViaLength

  let low = 0
  let high = steps.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (position(steps[middle]) < distance - MIN_OVERLAP) {
      low = middle + 1
      continue
    }
    high = middle
  }
  for (
    let index = low;
    index < steps.length && position(steps[index]) <= distance + MIN_OVERLAP;
    index++
  ) {
    const length = viaLength(steps[index])
    if (length > 0) return length
  }
  return 0
}

/** A span with no skew information. */
function unknownSpan({ from, to }: { from: number; to: number }): SkewSpan {
  return { from, to, startSkew: null, endSkew: null, coupling: "unknown" }
}

/**
 * Cuts the steps at span boundaries. Constant pieces stay whole; pieces
 * where skew changes are cut every {@link SAMPLE_LENGTH} mm, or every
 * {@link SKEW_STEP} mm of skew if that is coarser, each with the skew at its
 * middle.
 */
function sampleSkew({
  steps,
  spans,
}: {
  steps: TraceStep[]
  spans: SkewSpan[]
}): LocalSkewSegment[] {
  const segments: LocalSkewSegment[] = []
  let spanIndex = 0
  for (const step of steps) {
    const stepEnd = step.startDistance + step.length
    while (
      spanIndex + 1 < spans.length &&
      spans[spanIndex].to <= step.startDistance
    ) {
      spanIndex++
    }
    for (
      let index = spanIndex;
      index < spans.length && spans[index].from < stepEnd;
      index++
    ) {
      const span = spans[index]
      const from = Math.max(step.startDistance, span.from)
      const to = Math.min(stepEnd, span.to)
      if (to - from <= MIN_OVERLAP) continue

      const pieceCount = rampPieceCount({ span, from, to })
      for (let piece = 0; piece < pieceCount; piece++) {
        const pieceFrom = from + ((to - from) * piece) / pieceCount
        const pieceTo = from + ((to - from) * (piece + 1)) / pieceCount
        const localSkew = skewAt({ span, distance: (pieceFrom + pieceTo) / 2 })
        segments.push({
          start: pointAt({ step, distance: pieceFrom }),
          end: pointAt({ step, distance: pieceTo }),
          layer: step.layer,
          width: step.width,
          ...(localSkew !== null && { local_skew: localSkew }),
          coupling: span.coupling,
        })
      }
    }
  }
  return segments
}

/** How many pieces to cut a ramp between `from` and `to` into; 1 when skew barely changes. */
function rampPieceCount({
  span,
  from,
  to,
}: {
  span: SkewSpan
  from: number
  to: number
}): number {
  const startSkew = skewAt({ span, distance: from })
  const endSkew = skewAt({ span, distance: to })
  if (startSkew === null || endSkew === null) return 1
  const byLength = Math.ceil((to - from) / SAMPLE_LENGTH)
  const bySkew = Math.ceil(Math.abs(endSkew - startSkew) / SKEW_STEP)
  return Math.max(1, Math.min(byLength, bySkew))
}

/** The skew at a distance inside a span, rounded. */
function skewAt({
  span,
  distance,
}: {
  span: SkewSpan
  distance: number
}): number | null {
  if (span.startSkew === null || span.endSkew === null) return null
  const t = (distance - span.from) / (span.to - span.from)
  return roundSkew(span.startSkew + t * (span.endSkew - span.startSkew))
}

/** Rounds skew to 1/{@link SKEW_ROUNDING} mm, reporting -0 as 0. */
function roundSkew(skew: number): number {
  const rounded = Math.round(skew * SKEW_ROUNDING) / SKEW_ROUNDING
  if (rounded === 0) return 0
  return rounded
}

/** The point on a step at a distance along the whole walk. */
function pointAt({
  step,
  distance,
}: {
  step: TraceStep
  distance: number
}): Point {
  const fraction = (distance - step.startDistance) / step.length
  return {
    x: step.start.x + (step.end.x - step.start.x) * fraction,
    y: step.start.y + (step.end.y - step.start.y) * fraction,
  }
}
