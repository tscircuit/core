import type {
  PcbPort,
  PcbTrace,
  Point,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"
import { getTraceEndPorts } from "./walk-trace"

/** Trace ends without a port that lie within this many mm of each other (1 µm) are joined. */
const JOINT_TOLERANCE = 0.001

/** A differential pair side runs between two pins. */
const SIDE_PIN_COUNT = 2

/** A second route is enough to know the side's path is ambiguous. */
const MAX_ROUTES_TO_FIND = 2

/** One PCB trace of a side and whether it is walked against its stored route order. */
export type SidePiece = { pcbTrace: PcbTrace; isReversed: boolean }

/** Why a side's PCB traces cannot be put into one route between its pins. */
export type UnstitchableReason =
  | "not_two_pins"
  | "pins_not_joined"
  | "more_than_one_route"

/** A side's PCB traces in route order from one pin to the other, or the reason there is no such order. */
export type SideStitch =
  | { isStitched: true; pieces: SidePiece[] }
  | { isStitched: false; reason: UnstitchableReason }

/** Where one end of a PCB trace sits: the port its route names, else its position on a {@link JOINT_TOLERANCE} grid. */
type TraceEndKey = string

/** A PCB trace with the places its two ends sit. */
type TraceEnds = {
  pcbTrace: PcbTrace
  startKey: TraceEndKey
  endKey: TraceEndKey
}

/** The PCB port placed for each source port. */
export type PcbPortIdsBySourcePortId = Map<
  SourcePort["source_port_id"],
  PcbPort["pcb_port_id"]
>

/**
 * Orders the PCB traces of one differential pair side from one of its
 * two pins to the other by matching trace ends. PCB traces that belong to
 * the same source trace but branch off the path, such as a tap to a test
 * point on the same net, are left out.
 *
 * A side routed as a single PCB trace is that trace.
 */
export function stitchSide({
  sourceTrace,
  pcbTraces,
  pcbPortIdsBySourcePortId,
}: {
  sourceTrace: SourceTrace
  pcbTraces: PcbTrace[]
  pcbPortIdsBySourcePortId: PcbPortIdsBySourcePortId
}): SideStitch {
  if (pcbTraces.length === 1) {
    return {
      isStitched: true,
      pieces: [{ pcbTrace: pcbTraces[0], isReversed: false }],
    }
  }
  const pinSourcePortIds = sourceTrace.connected_source_port_ids
  if (pinSourcePortIds.length !== SIDE_PIN_COUNT) {
    return { isStitched: false, reason: "not_two_pins" }
  }
  const [fromKey, toKey] = pinSourcePortIds.map((sourcePortId) =>
    portKey(pcbPortIdsBySourcePortId.get(sourcePortId)),
  )
  const routes: SidePiece[][] = []
  collectRoutes({
    fromKey,
    toKey,
    traceEnds: pcbTraces.map(getTraceEnds),
    walked: [],
    routes,
  })
  if (routes.length === 0)
    return { isStitched: false, reason: "pins_not_joined" }
  if (routes.length > 1) {
    return { isStitched: false, reason: "more_than_one_route" }
  }
  return { isStitched: true, pieces: routes[0] }
}

/** Adds to `routes` every way to reach `toKey` from `fromKey` over traces not yet walked, up to {@link MAX_ROUTES_TO_FIND}. */
function collectRoutes({
  fromKey,
  toKey,
  traceEnds,
  walked,
  routes,
}: {
  fromKey: TraceEndKey
  toKey: TraceEndKey
  traceEnds: TraceEnds[]
  walked: SidePiece[]
  routes: SidePiece[][]
}): void {
  if (routes.length >= MAX_ROUTES_TO_FIND) return
  if (fromKey === toKey) {
    routes.push([...walked])
    return
  }
  for (const { pcbTrace, startKey, endKey } of traceEnds) {
    if (walked.some((piece) => piece.pcbTrace === pcbTrace)) continue
    let nextKey: TraceEndKey | undefined
    if (endKey === fromKey) nextKey = startKey
    if (startKey === fromKey) nextKey = endKey
    if (nextKey === undefined) continue
    walked.push({ pcbTrace, isReversed: startKey !== fromKey })
    collectRoutes({ fromKey: nextKey, toKey, traceEnds, walked, routes })
    walked.pop()
  }
}

/** The places the first and last points of a PCB trace's route sit. */
function getTraceEnds(pcbTrace: PcbTrace): TraceEnds {
  const { startPcbPortId, endPcbPortId } = getTraceEndPorts(pcbTrace)
  const positions = pcbTrace.route.flatMap(getRoutePointPositions)
  let startKey = pointKey(positions[0])
  let endKey = pointKey(positions[positions.length - 1])
  if (startPcbPortId !== undefined) startKey = portKey(startPcbPortId)
  if (endPcbPortId !== undefined) endKey = portKey(endPcbPortId)
  return { pcbTrace, startKey, endKey }
}

/** The key shared by every trace end at one PCB port. */
function portKey(pcbPortId: PcbPort["pcb_port_id"] | undefined): TraceEndKey {
  return `port:${pcbPortId}`
}

/** The key shared by trace ends at the same position, in PCB world XY (mm). */
function pointKey(point: Point): TraceEndKey {
  const column = Math.round(point.x / JOINT_TOLERANCE)
  const row = Math.round(point.y / JOINT_TOLERANCE)
  return `point:${column},${row}`
}
