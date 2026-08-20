import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"
import type { SourcePort, SourceTrace } from "circuit-json"
import type { Breakout } from "./Breakout"
import { createCoordinatedWindingBreakoutInput } from "./create-coordinated-winding-breakout-input"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>

export interface CoordinatedWindingBreakoutPoint {
  sourcePortId: SourcePortId
  sourceTraceId: SourceTraceId
  layer: string
  x: number
  y: number
}

/** Solve one shared two-region winding problem and return this region's points. */
export const solveCoordinatedWindingBreakoutPoints = (
  breakout: Breakout,
): readonly CoordinatedWindingBreakoutPoint[] | null => {
  const coordinatedInput = createCoordinatedWindingBreakoutInput(breakout)
  if (!coordinatedInput || !breakout.pcb_group_id) return null

  const solver = new WindingBreakoutSolver(coordinatedInput.solverInput)
  solver.solve()
  if (solver.failed) {
    throw new Error(solver.error ?? "Coordinated winding breakout solve failed")
  }
  const sourcePortIdByConnectionId =
    coordinatedInput.sourcePortIdByConnectionIdByRegionId.get(
      breakout.pcb_group_id,
    )!
  return solver
    .getOutput()
    .breakoutPoints.filter(
      (breakoutPoint) => breakoutPoint.regionId === breakout.pcb_group_id,
    )
    .map((breakoutPoint) => ({
      sourcePortId: sourcePortIdByConnectionId.get(breakoutPoint.connectionId)!,
      sourceTraceId: breakoutPoint.connectionId,
      layer: breakoutPoint.layer,
      x: breakoutPoint.x,
      y: breakoutPoint.y,
    }))
}
