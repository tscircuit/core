import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import type { Breakout } from "./Breakout"

/** Commit solved board-world handoff points (mm, +X right, +Y up, +Z above,
 * right-handed) only after the asynchronous routing stage succeeds. */
export function applyDogboneFanoutTraces(
  breakout: Breakout,
  traces: SimplifiedPcbTrace[],
) {
  for (const point of breakout.children) {
    if (!(point instanceof AutoplacedBreakoutPoint)) continue
    const trace = traces.find((trace) =>
      trace.connectsTo?.includes(point.matchedPort!.pcb_port_id!),
    )
    const exit = trace?.route.at(-1)
    if (!exit || exit.route_type !== "wire")
      throw new Error("Dogbone fanout lost its handoff")
    point._applySolvedBreakoutPoint({
      sourceTraceId: point.matchedSourceTraceId!,
      layer: exit.layer,
      position: exit,
    })
  }
}
