import type {
  AnyCircuitElement,
  LocalSkewCursor,
  LocalSkewRouteStep,
  PcbDifferentialPairLocalSkew,
  PcbTrace,
  PcbTraceRoutePoint,
  Point,
} from "circuit-json"

/** Coordinates and skew are rounded to 1/this mm (1 nm) so tests can compare them exactly. */
const ROUNDING = 1e6

/** A knot with its two cursors placed on the routed copper, in PCB world XY (mm, +X right, +Y up). */
export type KnotPoint = { positive: Point; negative: Point; skew: number }

/** The knots of every run of a local skew element, each placed on its PCB traces. */
export function getKnotPoints({
  circuitJson,
  localSkew,
}: {
  circuitJson: AnyCircuitElement[]
  localSkew: Pick<PcbDifferentialPairLocalSkew, "walks" | "runs">
}): KnotPoint[][] {
  const pcbTraces = circuitJson.filter(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )
  return localSkew.runs.map((run) =>
    run.map((knot) => ({
      positive: cursorPoint({
        pcbTraces,
        walk: localSkew.walks.positive,
        cursor: knot.positive,
      }),
      negative: cursorPoint({
        pcbTraces,
        walk: localSkew.walks.negative,
        cursor: knot.negative,
      }),
      skew: round(knot.skew),
    })),
  )
}

/** The point a cursor sits at on its route edge. */
function cursorPoint({
  pcbTraces,
  walk,
  cursor,
}: {
  pcbTraces: PcbTrace[]
  walk: LocalSkewRouteStep[]
  cursor: LocalSkewCursor
}): Point {
  const step = walk[cursor.step_index]
  const pcbTrace = pcbTraces.find(
    (trace) => trace.pcb_trace_id === step.pcb_trace_id,
  )
  if (!pcbTrace) throw new Error(`Missing PCB trace ${step.pcb_trace_id}`)
  let start = exitPoint(pcbTrace.route[step.edge_index])
  let end = entryPoint(pcbTrace.route[step.edge_index + 1])
  if (step.reverse) [start, end] = [end, start]
  return {
    x: round(start.x + (end.x - start.x) * cursor.u),
    y: round(start.y + (end.y - start.y) * cursor.u),
  }
}

/** Where copper leaves a route point: the far end of a through pad. */
function exitPoint(routePoint: PcbTraceRoutePoint): Point {
  if (routePoint.route_type === "through_pad") return routePoint.end
  return { x: routePoint.x, y: routePoint.y }
}

/** Where copper arrives at a route point: the near end of a through pad. */
function entryPoint(routePoint: PcbTraceRoutePoint): Point {
  if (routePoint.route_type === "through_pad") return routePoint.start
  return { x: routePoint.x, y: routePoint.y }
}

/** Rounds to 1/{@link ROUNDING} mm, reporting -0 as 0. */
function round(value: number): number {
  return Math.round(value * ROUNDING) / ROUNDING + 0
}

/** One line per knot, `P x,y  N x,y  skew s`, with a blank line between runs, so a test can show the knots at a glance. */
export function formatKnotPoints({
  circuitJson,
  localSkew,
}: {
  circuitJson: AnyCircuitElement[]
  localSkew: Pick<PcbDifferentialPairLocalSkew, "walks" | "runs">
}): string {
  return getKnotPoints({ circuitJson, localSkew })
    .map((run) =>
      run
        .map(
          ({ positive, negative, skew }) =>
            `P ${positive.x},${positive.y}  N ${negative.x},${negative.y}  skew ${skew}`,
        )
        .join("\n"),
    )
    .join("\n\n")
}
