import type {
  CircuitJson,
  LocalSkewCursor,
  LocalSkewKnot,
  PcbBoard,
  PcbDifferentialPairLocalSkew,
  PcbPort,
  PcbStackup,
  PcbTrace,
  SourceBus,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import {
  type LayerChangeBoard,
  STANDARD_BOARD_THICKNESS,
} from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { findCoupledRuns } from "./find-coupled-runs"
import { isNegativeRouteReversed } from "./is-negative-route-reversed"
import { type CoupledRun, MIN_OVERLAP } from "./select-coupled-runs"
import {
  type SidePiece,
  type PcbPortIdsBySourcePortId,
  type UnstitchableReason,
  stitchSide,
} from "./stitch-side"
import {
  type TraceStep,
  type TraceWalk,
  type WalkEdge,
  joinWalks,
  reverseWalk,
  walkTrace,
} from "./walk-trace"

// KiCad's fixed overlay colours (blue longer, red shorter), until a differential-pair prop can set them.
const LONGER_RGB: PcbDifferentialPairLocalSkew["longer_rgb"] = [0, 0, 255]
const SHORTER_RGB: PcbDifferentialPairLocalSkew["shorter_rgb"] = [255, 0, 0]

/** Skew is rounded to 1/this mm (10 nm), to suppress floating-point noise. */
const SKEW_ROUNDING = 1e5

type SubcircuitId = NonNullable<SourceBus["subcircuit_id"]>
type SourceTraceId = SourceTrace["source_trace_id"]
type PcbPortId = PcbPort["pcb_port_id"]
type SourcePortId = SourcePort["source_port_id"]

/** A pair's local skew as the Circuit JSON database takes it: without the type and ID it assigns. */
export type LocalSkewInsert = Omit<
  PcbDifferentialPairLocalSkew,
  "type" | "pcb_differential_pair_local_skew_id"
>

/** A routed pair without local skew because one side's PCB traces could not be put in order. */
export type UnmeasuredPair = {
  sourceBus: SourceBus
  /** The side whose PCB traces could not be put in order. */
  sourceTrace: SourceTrace
  pcbTraces: PcbTrace[]
  reason: UnstitchableReason
}

/** The local skew of every pair that couples, and the routed pairs that could not be measured. */
export type LocalSkewResult = {
  localSkews: LocalSkewInsert[]
  unmeasuredPairs: UnmeasuredPair[]
}

/** The parts of a circuit that local skew reads, indexed by ID. */
type CircuitIndex = {
  pcbTracesBySourceTraceId: Map<SourceTraceId, PcbTrace[]>
  sourceTracesById: Map<SourceTraceId, SourceTrace>
  pcbPortsById: Map<PcbPortId, PcbPort>
  pcbPortIdsBySourcePortId: PcbPortIdsBySourcePortId
  sourcePortsById: Map<SourcePortId, SourcePort>
  pcbBoardsBySubcircuitId: Map<SubcircuitId, PcbBoard>
  parentSubcircuitIds: Map<SubcircuitId, SubcircuitId>
  pcbStackupsByBoardId: Map<PcbBoard["pcb_board_id"], PcbStackup>
}

/** A position on each walk, in mm along the walk from its first point. */
type WalkPositions = { positive: number; negative: number }

/** Distances along a walk where its route edges stop and a layer change or through pad begins or ends, in mm. */
type EdgeBreaks = number[]

/** The end of a walk that a signal leaves from. */
type WalkEnd = "start" | "end"

/**
 * Computes local skew along every routed differential pair: at each point,
 * how much farther one side has run than the other, not only at the
 * ends. Positions are PCB world XY in mm (+X right, +Y up).
 *
 * Distances are copper length: planar length plus the Z-distance of each
 * layer change, as in `trace_length`. Each side with exactly one end
 * port marked `is_output` is walked from that end; if only one side has
 * such a port, the other is oriented to match it by end distance; if neither
 * does, distances are measured from the positive side's first route
 * point and the negative side is walked from the end that matches it.
 */
export function computeLocalSkew({
  circuitJson,
}: {
  circuitJson: CircuitJson
}): LocalSkewResult {
  const circuitIndex = indexCircuit(circuitJson)
  const result: LocalSkewResult = { localSkews: [], unmeasuredPairs: [] }
  for (const element of circuitJson) {
    if (element.type !== "source_bus") continue
    measurePair({ sourceBus: element, circuitIndex, result })
  }
  return result
}

/** Indexes the elements local skew reads. */
function indexCircuit(circuitJson: CircuitJson): CircuitIndex {
  const circuitIndex: CircuitIndex = {
    pcbTracesBySourceTraceId: new Map(),
    sourceTracesById: new Map(),
    pcbPortsById: new Map(),
    pcbPortIdsBySourcePortId: new Map(),
    sourcePortsById: new Map(),
    pcbBoardsBySubcircuitId: new Map(),
    parentSubcircuitIds: new Map(),
    pcbStackupsByBoardId: new Map(),
  }
  for (const element of circuitJson) {
    if (element.type === "pcb_board" && element.subcircuit_id !== undefined) {
      circuitIndex.pcbBoardsBySubcircuitId.set(element.subcircuit_id, element)
      continue
    }
    if (
      element.type === "source_group" &&
      element.subcircuit_id !== undefined &&
      element.parent_subcircuit_id !== undefined
    ) {
      circuitIndex.parentSubcircuitIds.set(
        element.subcircuit_id,
        element.parent_subcircuit_id,
      )
      continue
    }
    if (element.type === "pcb_stackup") {
      circuitIndex.pcbStackupsByBoardId.set(element.pcb_board_id, element)
      continue
    }
    if (element.type === "pcb_port") {
      circuitIndex.pcbPortsById.set(element.pcb_port_id, element)
      circuitIndex.pcbPortIdsBySourcePortId.set(
        element.source_port_id,
        element.pcb_port_id,
      )
      continue
    }
    if (element.type === "source_port") {
      circuitIndex.sourcePortsById.set(element.source_port_id, element)
      continue
    }
    if (element.type === "source_trace") {
      circuitIndex.sourceTracesById.set(element.source_trace_id, element)
      continue
    }
    if (element.type !== "pcb_trace") continue
    if (element.source_trace_id === undefined) continue
    const pcbTraces =
      circuitIndex.pcbTracesBySourceTraceId.get(element.source_trace_id) ?? []
    pcbTraces.push(element)
    circuitIndex.pcbTracesBySourceTraceId.set(
      element.source_trace_id,
      pcbTraces,
    )
  }
  return circuitIndex
}

/**
 * Adds one differential pair's local skew to `result`. Nothing is added for
 * a bus that is not a pair of two different traces, a pair that is not fully
 * routed, or a pair whose sides never couple. A routed pair whose PCB
 * traces cannot be put in order is added to the unmeasured pairs.
 */
function measurePair({
  sourceBus,
  circuitIndex,
  result,
}: {
  sourceBus: SourceBus
  circuitIndex: CircuitIndex
  result: LocalSkewResult
}): void {
  const differentialPair = sourceBus.differential_pair
  if (!differentialPair) return
  const positiveId = differentialPair.positive_source_trace_id
  const negativeId = differentialPair.negative_source_trace_id
  if (positiveId === negativeId) return

  const layerChangeBoard = findLayerChangeBoard({
    subcircuitId: sourceBus.subcircuit_id,
    circuitIndex,
  })
  const walks: TraceWalk[] = []
  for (const sourceTraceId of [positiveId, negativeId]) {
    const pcbTraces = circuitIndex.pcbTracesBySourceTraceId.get(sourceTraceId)
    if (!pcbTraces) return
    const sourceTrace = circuitIndex.sourceTracesById.get(sourceTraceId)!
    const stitch = stitchSide({
      sourceTrace,
      pcbTraces,
      pcbPortIdsBySourcePortId: circuitIndex.pcbPortIdsBySourcePortId,
    })
    if (!stitch.isStitched) {
      result.unmeasuredPairs.push({
        sourceBus,
        sourceTrace,
        pcbTraces,
        reason: stitch.reason,
      })
      return
    }
    walks.push(
      joinWalks(
        stitch.pieces.map((piece) => walkPiece({ piece, ...layerChangeBoard })),
      ),
    )
  }
  let [positive, negative] = walks
  // A side without a route edge of planar length has nothing to measure against.
  if (positive.edges.length === 0 || negative.edges.length === 0) return

  const positiveOutput = outputEnd({ walk: positive, circuitIndex })
  const negativeOutput = outputEnd({ walk: negative, circuitIndex })
  if (positiveOutput === "end") positive = reverseWalk(positive)
  if (negativeOutput === "end") negative = reverseWalk(negative)
  if (
    (!positiveOutput || !negativeOutput) &&
    isNegativeRouteReversed({
      positiveSteps: positive.steps,
      negativeSteps: negative.steps,
    })
  ) {
    if (negativeOutput) positive = reverseWalk(positive)
    if (!negativeOutput) negative = reverseWalk(negative)
  }
  const runs = findCoupledRuns({
    positive: positive.steps,
    negative: negative.steps,
    traceGap: differentialPair.trace_gap,
  })
  if (runs.length === 0) return

  const positions = splitAtEdgeBreaks({
    positions: knownSkewPositions({
      runs,
      positiveSteps: positive.steps,
      negativeSteps: negative.steps,
    }),
    positiveBreaks: edgeBreaks(positive),
    negativeBreaks: edgeBreaks(negative),
  })
  const [firstKnot, secondKnot, ...laterKnots] = knotsAt({
    positions,
    positiveEdges: positive.edges,
    negativeEdges: negative.edges,
  })
  // Coupled copper that lies only across through pads has no route edge to draw on.
  if (secondKnot === undefined) return
  const [firstPositiveEdge, ...laterPositiveEdges] = positive.edges
  const [firstNegativeEdge, ...laterNegativeEdges] = negative.edges

  const localSkew: LocalSkewInsert = {
    source_bus_id: sourceBus.source_bus_id,
    walks: {
      positive: [
        firstPositiveEdge.routeStep,
        ...laterPositiveEdges.map((edge) => edge.routeStep),
      ],
      negative: [
        firstNegativeEdge.routeStep,
        ...laterNegativeEdges.map((edge) => edge.routeStep),
      ],
    },
    runs: [[firstKnot, secondKnot, ...laterKnots]],
    longer_rgb: LONGER_RGB,
    shorter_rgb: SHORTER_RGB,
  }
  if (sourceBus.subcircuit_id !== undefined) {
    localSkew.subcircuit_id = sourceBus.subcircuit_id
  }
  result.localSkews.push(localSkew)
}

/**
 * The stackup and thickness of the board that owns a subcircuit, found by
 * following its parent subcircuits. A pair that is not on a board uses the
 * standard thickness, like `trace_length`.
 */
function findLayerChangeBoard({
  subcircuitId,
  circuitIndex,
}: {
  subcircuitId: SubcircuitId | undefined
  circuitIndex: CircuitIndex
}): LayerChangeBoard {
  let ownerSubcircuitId = subcircuitId
  while (ownerSubcircuitId !== undefined) {
    const pcbBoard = circuitIndex.pcbBoardsBySubcircuitId.get(ownerSubcircuitId)
    if (pcbBoard) {
      return {
        pcbStackup: circuitIndex.pcbStackupsByBoardId.get(
          pcbBoard.pcb_board_id,
        ),
        boardThickness: pcbBoard.thickness,
      }
    }
    ownerSubcircuitId = circuitIndex.parentSubcircuitIds.get(ownerSubcircuitId)
  }
  return { boardThickness: STANDARD_BOARD_THICKNESS }
}

/** Walks one PCB trace of a side in the direction the side runs. */
function walkPiece({
  piece,
  pcbStackup,
  boardThickness,
}: { piece: SidePiece } & LayerChangeBoard): TraceWalk {
  const walk = walkTrace({
    pcbTrace: piece.pcbTrace,
    pcbStackup,
    boardThickness,
  })
  if (piece.isReversed) return reverseWalk(walk)
  return walk
}

/**
 * Which end of a walk is connected to an output port (`source_port.is_output`),
 * or null unless exactly one end port is an output.
 */
function outputEnd({
  walk,
  circuitIndex,
}: {
  walk: TraceWalk
  circuitIndex: CircuitIndex
}): WalkEnd | null {
  const startIsOutput = isOutputPort({
    pcbPortId: walk.startPcbPortId,
    circuitIndex,
  })
  const endIsOutput = isOutputPort({
    pcbPortId: walk.endPcbPortId,
    circuitIndex,
  })
  if (startIsOutput === endIsOutput) return null
  if (startIsOutput) return "start"
  return "end"
}

/** Whether the source port behind this PCB port drives the signal. */
function isOutputPort({
  pcbPortId,
  circuitIndex,
}: {
  pcbPortId: PcbPortId | undefined
  circuitIndex: CircuitIndex
}): boolean {
  if (pcbPortId === undefined) return false
  const pcbPort = circuitIndex.pcbPortsById.get(pcbPortId)
  if (!pcbPort) return false
  const sourcePort = circuitIndex.sourcePortsById.get(pcbPort.source_port_id)
  return sourcePort?.is_output === true
}

/**
 * Paired positions where skew is known, in walk order: the two ends of
 * every coupled run, the other end of a layer change at the first run's
 * start and the last run's end, and the ends of the copper between two
 * runs. Skew runs linearly between neighbouring positions, so a layer change
 * right at a run's end is a step at the via, not part of the ramp across the
 * uncoupled copper. Copper before the first run and after the last is unknown.
 */
function knownSkewPositions({
  runs,
  positiveSteps,
  negativeSteps,
}: {
  runs: CoupledRun[]
  positiveSteps: TraceStep[]
  negativeSteps: TraceStep[]
}): WalkPositions[] {
  const firstRun = runs[0]
  const positions: WalkPositions[] = [
    {
      positive:
        firstRun.positiveStart -
        viaAt({
          steps: positiveSteps,
          distance: firstRun.positiveStart,
          edge: "start",
        }),
      negative:
        firstRun.negativeStart -
        viaAt({
          steps: negativeSteps,
          distance: firstRun.negativeStart,
          edge: "start",
        }),
    },
  ]
  for (const [index, run] of runs.entries()) {
    const previous = runs[index - 1]
    if (previous !== undefined) {
      positions.push(
        positionsAfterRun({ run: previous, positiveSteps, negativeSteps }),
        positionsBeforeRun({ previous, run, positiveSteps, negativeSteps }),
      )
    }
    positions.push(
      { positive: run.positiveStart, negative: run.negativeStart },
      { positive: run.positiveEnd, negative: run.negativeEnd },
    )
  }
  positions.push(
    positionsAfterRun({
      run: runs[runs.length - 1],
      positiveSteps,
      negativeSteps,
    }),
  )
  return keepWalkOrder(positions)
}

/** The positions just past any layer change at the end of a coupled run. */
function positionsAfterRun({
  run,
  positiveSteps,
  negativeSteps,
}: {
  run: CoupledRun
  positiveSteps: TraceStep[]
  negativeSteps: TraceStep[]
}): WalkPositions {
  return {
    positive:
      run.positiveEnd +
      viaAt({ steps: positiveSteps, distance: run.positiveEnd, edge: "end" }),
    negative:
      run.negativeEnd +
      viaAt({ steps: negativeSteps, distance: run.negativeEnd, edge: "end" }),
  }
}

/**
 * The positions where the copper between two coupled runs reaches the later
 * run. A side with copper between the runs stops before any layer
 * change at the later run's start; one with only a via between them has
 * already crossed it at the earlier run's end.
 */
function positionsBeforeRun({
  previous,
  run,
  positiveSteps,
  negativeSteps,
}: {
  previous: CoupledRun
  run: CoupledRun
  positiveSteps: TraceStep[]
  negativeSteps: TraceStep[]
}): WalkPositions {
  return {
    positive: distanceBeforeRun({
      steps: positiveSteps,
      previousEnd: previous.positiveEnd,
      runStart: run.positiveStart,
    }),
    negative: distanceBeforeRun({
      steps: negativeSteps,
      previousEnd: previous.negativeEnd,
      runStart: run.negativeStart,
    }),
  }
}

/** Where one side's copper between two runs reaches the later run, in mm along its walk. */
function distanceBeforeRun({
  steps,
  previousEnd,
  runStart,
}: {
  steps: TraceStep[]
  previousEnd: number
  runStart: number
}): number {
  const leftPreviousRun =
    previousEnd + viaAt({ steps, distance: previousEnd, edge: "end" })
  if (runStart - leftPreviousRun <= MIN_OVERLAP) return runStart
  return runStart - viaAt({ steps, distance: runStart, edge: "start" })
}

/** Removes rounding noise that would step a position back along its walk, and repeated positions. */
function keepWalkOrder(positions: WalkPositions[]): WalkPositions[] {
  const ordered: WalkPositions[] = []
  for (const position of positions) {
    const previous = ordered[ordered.length - 1]
    if (previous === undefined) {
      ordered.push(position)
      continue
    }
    const next = {
      positive: Math.max(previous.positive, position.positive),
      negative: Math.max(previous.negative, position.negative),
    }
    const isRepeat =
      next.positive - previous.positive <= MIN_OVERLAP &&
      next.negative - previous.negative <= MIN_OVERLAP
    if (isRepeat) continue
    ordered.push(next)
  }
  return ordered
}

/** The distances where a walk's route edges stop for a layer change or a through pad, and where they resume. */
function edgeBreaks(walk: TraceWalk): EdgeBreaks {
  const breaks: EdgeBreaks = []
  let reached = 0
  for (const edge of walk.edges) {
    if (edge.startDistance - reached > MIN_OVERLAP) {
      breaks.push(reached, edge.startDistance)
    }
    reached = edge.startDistance + edge.length
  }
  if (walk.length - reached > MIN_OVERLAP) breaks.push(reached)
  return breaks
}

/**
 * Adds a position wherever either walk stops or resumes its route edges
 * between two neighbouring positions, so a side crossing a via moves
 * only within its own span and skew stays linear in drawn copper length.
 */
function splitAtEdgeBreaks({
  positions,
  positiveBreaks,
  negativeBreaks,
}: {
  positions: WalkPositions[]
  positiveBreaks: EdgeBreaks
  negativeBreaks: EdgeBreaks
}): WalkPositions[] {
  const split: WalkPositions[] = []
  for (const [index, to] of positions.entries()) {
    const from = positions[index - 1]
    if (from === undefined) {
      split.push(to)
      continue
    }
    const fractions = [
      ...fractionsAtBreaks({
        from: from.positive,
        to: to.positive,
        breaks: positiveBreaks,
      }),
      ...fractionsAtBreaks({
        from: from.negative,
        to: to.negative,
        breaks: negativeBreaks,
      }),
    ].sort((a, b) => a - b)
    for (const fraction of fractions) {
      split.push({
        positive: from.positive + (to.positive - from.positive) * fraction,
        negative: from.negative + (to.negative - from.negative) * fraction,
      })
    }
    split.push(to)
  }
  return keepWalkOrder(split)
}

/** How far from `from` to `to` each break strictly between them lies, as a fraction. */
function fractionsAtBreaks({
  from,
  to,
  breaks,
}: {
  from: number
  to: number
  breaks: EdgeBreaks
}): number[] {
  return breaks
    .filter(
      (distance) =>
        distance - from > MIN_OVERLAP && to - distance > MIN_OVERLAP,
    )
    .map((distance) => (distance - from) / (to - from))
}

/**
 * The knots at each pair of positions: a cursor on each walk and the skew,
 * positive length walked minus negative length walked, rounded. Positions
 * that land on the same two cursors, inside layer changes on both walks,
 * keep the later skew.
 */
function knotsAt({
  positions,
  positiveEdges,
  negativeEdges,
}: {
  positions: WalkPositions[]
  positiveEdges: WalkEdge[]
  negativeEdges: WalkEdge[]
}): LocalSkewKnot[] {
  const knots: LocalSkewKnot[] = []
  for (const position of positions) {
    const knot: LocalSkewKnot = {
      positive: cursorAt({ edges: positiveEdges, distance: position.positive }),
      negative: cursorAt({ edges: negativeEdges, distance: position.negative }),
      skew: roundSkew(position.positive - position.negative),
    }
    const previous = knots[knots.length - 1]
    if (
      previous !== undefined &&
      isSameCursor({ a: previous.positive, b: knot.positive }) &&
      isSameCursor({ a: previous.negative, b: knot.negative })
    ) {
      knots[knots.length - 1] = knot
      continue
    }
    knots.push(knot)
  }
  return knots
}

/**
 * The cursor at a distance along a walk: on the last route edge that starts
 * at or before it. A distance inside a layer change stays at the end of the
 * edge before it until the walk reaches the next edge.
 */
function cursorAt({
  edges,
  distance,
}: {
  edges: WalkEdge[]
  distance: number
}): LocalSkewCursor {
  let low = 0
  let high = edges.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (edges[middle].startDistance <= distance + MIN_OVERLAP) {
      low = middle + 1
      continue
    }
    high = middle
  }
  const stepIndex = Math.max(low - 1, 0)
  const edge = edges[stepIndex]
  const along = distance - edge.startDistance
  if (along <= MIN_OVERLAP) return { step_index: stepIndex, u: 0 }
  if (edge.length - along <= MIN_OVERLAP) return { step_index: stepIndex, u: 1 }
  return { step_index: stepIndex, u: along / edge.length }
}

/** True when two cursors are the same position on a walk. */
function isSameCursor({
  a,
  b,
}: {
  a: LocalSkewCursor
  b: LocalSkewCursor
}): boolean {
  return a.step_index === b.step_index && a.u === b.u
}

/** Length of any layer change directly before the start or after the end of a step at `distance`, in mm. */
function viaAt({
  steps,
  distance,
  edge,
}: {
  steps: TraceStep[]
  distance: number
  edge: WalkEnd
}): number {
  let lengthKey: "startViaLength" | "endViaLength" = "startViaLength"
  if (edge === "end") lengthKey = "endViaLength"
  let low = 0
  let high = steps.length
  while (low < high) {
    const middle = (low + high) >> 1
    const edgeDistance = stepEdgeDistance({ step: steps[middle], edge })
    if (edgeDistance < distance - MIN_OVERLAP) {
      low = middle + 1
      continue
    }
    high = middle
  }
  for (let index = low; index < steps.length; index++) {
    const edgeDistance = stepEdgeDistance({ step: steps[index], edge })
    if (edgeDistance > distance + MIN_OVERLAP) break
    const length = steps[index][lengthKey]
    if (length > 0) return length
  }
  return 0
}

/** The distance along the walk to a step's start or end, in mm. */
function stepEdgeDistance({
  step,
  edge,
}: {
  step: TraceStep
  edge: WalkEnd
}): number {
  if (edge === "start") return step.startDistance
  return step.startDistance + step.length
}

/** Rounds skew to 1/{@link SKEW_ROUNDING} mm, reporting -0 as 0. */
function roundSkew(skew: number): number {
  const rounded = Math.round(skew * SKEW_ROUNDING) / SKEW_ROUNDING
  if (rounded === 0) return 0
  return rounded
}
