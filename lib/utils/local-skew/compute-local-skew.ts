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
import { STANDARD_BOARD_THICKNESS } from "lib/components/primitive-components/Trace/trace-utils/get-trace-length-on-board"
import { findCoupledRuns } from "./find-coupled-runs"
import { isNegativeRouteReversed } from "./is-negative-route-reversed"
import { type CoupledRun, MIN_OVERLAP } from "./select-coupled-runs"
import type {
  LocalSkewSegment,
  PcbDifferentialPairLocalSkewInsert,
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

/** The largest skew of each sign on one trace, both nonnegative, in mm. */
type SkewScale = { positive: number; negative: number }

/** One trace's skew spans and its per-sign scale. */
type SkewTrack = { spans: SkewSpan[]; scale: SkewScale }

/** Where a coupled run starts and ends on one trace (`from`, `to`) and on its partner, in mm along each walk. */
type RunEnds = { from: number; to: number; otherFrom: number; otherTo: number }
type SubcircuitId = NonNullable<SourceBus["subcircuit_id"]>
type PcbPortId = PcbPort["pcb_port_id"]
type SourcePortId = SourcePort["source_port_id"]

/** A stretch of one trace with skew changing linearly from `startSkew` to `endSkew`; null where it is unknown. */
type SkewSpan = {
  from: number
  to: number
  startSkew: number | null
  endSkew: number | null
}

/** Routed copper grouped by the source trace it belongs to. */
type TracesBySource = Map<SourceTrace["source_trace_id"], PcbTrace[]>

/** A differential pair with a side routed as several pcb_traces, whose order along the signal isn't recorded. */
export type SplitPair = {
  bus: SourceBus
  /** The pcb_traces carrying each side. */
  positiveTraces: PcbTrace[]
  negativeTraces: PcbTrace[]
}

/** A differential pair whose calculation threw, and the error message. */
export type FailedPair = { bus: SourceBus; reason: string }

/** Local skew for every measurable pair, and the pairs that could not be measured. */
export type LocalSkewResult = {
  pairs: PcbDifferentialPairLocalSkewInsert[]
  splitPairs: SplitPair[]
  failedPairs: FailedPair[]
}

/**
 * Computes local skew along every routed differential pair: at each point,
 * how much farther one trace has run than the other, not only at the ends.
 *
 * Distances are copper length, as `pcb_trace.trace_length` measures it:
 * planar length plus each layer change's Z-distance. Each trace with exactly one end port marked `is_output`
 * is walked from that end; if only one trace has such a port, the other is
 * oriented to match it by end distance; if neither does, distances are
 * measured from the positive trace's first route point and the negative
 * trace is walked from the end that matches it.
 */
export function computeLocalSkew({
  circuitJson,
}: {
  circuitJson: CircuitJson
}): LocalSkewResult {
  const index = indexCircuit({ circuitJson })
  const { tracesBySource } = index
  const result: LocalSkewResult = { pairs: [], splitPairs: [], failedPairs: [] }
  for (const bus of circuitJson) {
    if (bus.type !== "source_bus") continue
    const differentialPair = bus.differential_pair
    if (!differentialPair) continue
    const positiveId = differentialPair.positive_source_trace_id
    const negativeId = differentialPair.negative_source_trace_id
    if (positiveId === negativeId) continue
    const positiveTraces = tracesBySource.get(positiveId) ?? []
    const negativeTraces = tracesBySource.get(negativeId) ?? []
    if (positiveTraces.length > 1 || negativeTraces.length > 1) {
      result.splitPairs.push({ bus, positiveTraces, negativeTraces })
      continue
    }
    if (positiveTraces.length === 0 || negativeTraces.length === 0) continue
    try {
      result.pairs.push(
        computePairSkew({
          bus,
          traceGap: differentialPair.trace_gap,
          positiveTrace: positiveTraces[0],
          negativeTrace: negativeTraces[0],
          index,
        }),
      )
    } catch (error) {
      // A failed pair must not hide skew on the rest of the board.
      result.failedPairs.push({ bus, reason: errorMessage(error) })
    }
  }
  return result
}

/** Lookups built once from the Circuit JSON. */
type CircuitIndex = {
  tracesBySource: TracesBySource
  pcbPortsById: Map<PcbPortId, PcbPort>
  sourcePortsById: Map<SourcePortId, SourcePort>
  parentBySubcircuit: Map<SubcircuitId, SubcircuitId>
  boardsBySubcircuit: Map<SubcircuitId, PcbBoard>
  stackupsByBoard: Map<PcbBoard["pcb_board_id"], PcbStackup>
}

/** Indexes the elements local skew reads: routed traces by source trace, ports, boards, stackups and the subcircuit tree. */
function indexCircuit({
  circuitJson,
}: {
  circuitJson: CircuitJson
}): CircuitIndex {
  const index: CircuitIndex = {
    tracesBySource: new Map(),
    pcbPortsById: new Map(),
    sourcePortsById: new Map(),
    parentBySubcircuit: new Map(),
    boardsBySubcircuit: new Map(),
    stackupsByBoard: new Map(),
  }
  for (const element of circuitJson) {
    if (element.type === "pcb_board") {
      if (element.subcircuit_id !== undefined) {
        index.boardsBySubcircuit.set(element.subcircuit_id, element)
      }
      continue
    }
    if (
      element.type === "source_group" &&
      element.subcircuit_id !== undefined &&
      element.parent_subcircuit_id !== undefined
    ) {
      index.parentBySubcircuit.set(
        element.subcircuit_id,
        element.parent_subcircuit_id,
      )
      continue
    }
    if (element.type === "pcb_stackup") {
      index.stackupsByBoard.set(element.pcb_board_id, element)
      continue
    }
    if (element.type === "pcb_port") {
      index.pcbPortsById.set(element.pcb_port_id, element)
      continue
    }
    if (element.type === "source_port") {
      index.sourcePortsById.set(element.source_port_id, element)
      continue
    }
    if (element.type !== "pcb_trace") continue
    if (element.source_trace_id === undefined) continue
    const traces = index.tracesBySource.get(element.source_trace_id) ?? []
    traces.push(element)
    index.tracesBySource.set(element.source_trace_id, traces)
  }
  return index
}

/** The board that owns a subcircuit: its own, or the nearest ancestor's. */
function findBoard({
  index,
  subcircuitId,
}: {
  index: CircuitIndex
  subcircuitId: SubcircuitId | undefined
}): PcbBoard | undefined {
  let current = subcircuitId
  while (current !== undefined) {
    const board = index.boardsBySubcircuit.get(current)
    if (board) return board
    current = index.parentBySubcircuit.get(current)
  }
  return undefined
}

/** Local skew for one differential pair routed as one pcb_trace per side. */
function computePairSkew({
  bus,
  traceGap,
  positiveTrace,
  negativeTrace,
  index,
}: {
  bus: SourceBus
  /** The pair's declared edge-to-edge gap in mm, if any. */
  traceGap: number | undefined
  positiveTrace: PcbTrace
  negativeTrace: PcbTrace
  index: CircuitIndex
}): PcbDifferentialPairLocalSkewInsert {
  const subcircuitId =
    positiveTrace.subcircuit_id ??
    negativeTrace.subcircuit_id ??
    bus.subcircuit_id
  const board = findBoard({ index, subcircuitId })
  let pcbStackup: PcbStackup | undefined
  let boardThickness = STANDARD_BOARD_THICKNESS
  if (board) {
    pcbStackup = index.stackupsByBoard.get(board.pcb_board_id)
    boardThickness = board.thickness
  }

  let positive = walkTrace({
    trace: positiveTrace,
    pcbStackup,
    boardThickness,
  })
  let negative = walkTrace({
    trace: negativeTrace,
    pcbStackup,
    boardThickness,
  })
  const positiveOutput = outputEnd({ trace: positiveTrace, index })
  const negativeOutput = outputEnd({ trace: negativeTrace, index })
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
    traceGap,
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

  const pair: PcbDifferentialPairLocalSkewInsert = {
    type: "pcb_differential_pair_local_skew",
    source_bus_id: bus.source_bus_id,
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
  if (bus.subcircuit_id !== undefined) pair.subcircuit_id = bus.subcircuit_id
  if (bus.max_length_skew !== undefined) {
    pair.max_length_skew = bus.max_length_skew
  }
  if (runs.length > 0) {
    pair.max_local_skew = Math.max(
      positiveTrack.scale.positive,
      positiveTrack.scale.negative,
      negativeTrack.scale.positive,
      negativeTrack.scale.negative,
    )
  }
  return pair
}

/** The message of a thrown value. */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Which end of `trace` is connected to an output port (`source_port.is_output`),
 * or null unless exactly one end port is an output.
 */
function outputEnd({
  trace,
  index,
}: {
  trace: PcbTrace
  index: CircuitIndex
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
  const startIsOutput = isOutputPort({ index, pcbPortId: startPortId })
  const endIsOutput = isOutputPort({ index, pcbPortId: endPortId })
  if (startIsOutput === endIsOutput) return null
  if (startIsOutput) return "start"
  return "end"
}

/** True when a PCB port's source port is marked `is_output`. */
function isOutputPort({
  index,
  pcbPortId,
}: {
  index: CircuitIndex
  pcbPortId: PcbPortId | undefined
}): boolean {
  if (pcbPortId === undefined) return false
  const pcbPort = index.pcbPortsById.get(pcbPortId)
  if (!pcbPort) return false
  return index.sourcePortsById.get(pcbPort.source_port_id)?.is_output === true
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
}): SkewTrack {
  const coupled = runs
    .map((run) => {
      const { from, to, otherFrom, otherTo } = runEnds({ run, side })
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
  const scale: SkewScale = { positive: 0, negative: 0 }
  const spans: SkewSpan[] = []
  const first = coupled[0]
  if (first.startVia > 0 || first.otherStartVia > 0) {
    recordSkew({
      scale,
      skew: first.startSkew - first.startVia + first.otherStartVia,
    })
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
        let otherStartVia = 0
        if (partnerHasCopperGap) otherStartVia = run.otherStartVia
        const beforeRun = run.startSkew - run.startVia + otherStartVia
        recordSkew({ scale, skew: afterPrevious })
        recordSkew({ scale, skew: beforeRun })
        spans.push({
          from: gapFrom,
          to: gapTo,
          startSkew: afterPrevious,
          endSkew: beforeRun,
        })
      }
    }
    recordSkew({ scale, skew: run.startSkew })
    recordSkew({ scale, skew: run.endSkew })
    spans.push({
      from: run.from,
      to: run.to,
      startSkew: run.startSkew,
      endSkew: run.endSkew,
    })
  })
  const last = coupled[coupled.length - 1]
  if (last.endVia > 0 || last.otherEndVia > 0) {
    recordSkew({
      scale,
      skew: last.endSkew + last.endVia - last.otherEndVia,
    })
  }
  if (totalLength - last.to > MIN_OVERLAP) {
    spans.push(unknownSpan({ from: last.to, to: totalLength }))
  }
  return { spans, scale }
}

/** A run's ends on `side` and on the partner trace. */
function runEnds({
  run,
  side,
}: {
  run: CoupledRun
  side: "positive" | "negative"
}): RunEnds {
  if (side === "positive") {
    return {
      from: run.positiveStart,
      to: run.positiveEnd,
      otherFrom: run.negativeStart,
      otherTo: run.negativeEnd,
    }
  }
  return {
    from: run.negativeStart,
    to: run.negativeEnd,
    otherFrom: run.positiveStart,
    otherTo: run.positiveEnd,
  }
}

/** Widens a trace's per-sign scale to include `skew`, rounded. */
function recordSkew({ scale, skew }: { scale: SkewScale; skew: number }): void {
  const rounded = roundSkew(skew)
  if (rounded > scale.positive) scale.positive = rounded
  if (-rounded > scale.negative) scale.negative = -rounded
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
  let low = 0
  let high = steps.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (edgeDistance({ step: steps[middle], edge }) < distance - MIN_OVERLAP) {
      low = middle + 1
      continue
    }
    high = middle
  }
  for (
    let index = low;
    index < steps.length &&
    edgeDistance({ step: steps[index], edge }) <= distance + MIN_OVERLAP;
    index++
  ) {
    const length = edgeViaLength({ step: steps[index], edge })
    if (length > 0) return length
  }
  return 0
}

/** Distance along the walk to a step's start or end, in mm. */
function edgeDistance({
  step,
  edge,
}: {
  step: TraceStep
  edge: "start" | "end"
}): number {
  if (edge === "start") return step.startDistance
  return step.startDistance + step.length
}

/** Length of the via directly before a step's start or after its end, in mm. */
function edgeViaLength({
  step,
  edge,
}: {
  step: TraceStep
  edge: "start" | "end"
}): number {
  if (edge === "start") return step.startViaLength
  return step.endViaLength
}

/** A span with no skew information. */
function unknownSpan({ from, to }: { from: number; to: number }): SkewSpan {
  return { from, to, startSkew: null, endSkew: null }
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
        const segment: LocalSkewSegment = {
          start: pointAt({ step, distance: pieceFrom }),
          end: pointAt({ step, distance: pieceTo }),
          layer: step.layer,
          width: step.width,
        }
        if (localSkew !== null) segment.local_skew = localSkew
        segments.push(segment)
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
