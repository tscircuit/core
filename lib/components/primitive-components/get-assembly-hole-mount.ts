import type { NamedReferencePlane } from "jscad-planner"
import type { Hole } from "./Hole"
import type { PlatedHole } from "./PlatedHole"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export type AssemblyMountHole = Hole | PlatedHole
export const isAssemblyMountHole = (
  part: PrimitiveComponent,
): part is AssemblyMountHole =>
  part.componentName === "Hole" || part.componentName === "PlatedHole"

/** Finalized PCB-world frame, right-handed XYZ, mm, +Z above. Origin is the
 * hole center on the selected board surface; normal and xAxis are directions.
 * Hole XY comes from emitted PCB geometry after layout; tangents use the same
 * finalized footprint transform as Hole.doInitialPcbPrimitiveRender.
 */
export const getAssemblyHoleMount = (
  hole: AssemblyMountHole,
  side: "top" | "bottom" = "top",
) => {
  const db = hole.root!.db
  const geometry =
    hole.componentName === "Hole"
      ? db.pcb_hole.get((hole as Hole).pcb_hole_id!)
      : db.pcb_plated_hole.get((hole as PlatedHole).pcb_plated_hole_id!)
  const board = hole._getBoard()
  const pcbBoard = board?.pcb_board_id
    ? db.pcb_board.get(board.pcb_board_id)
    : undefined
  if (!geometry || !pcbBoard)
    throw new Error(
      `Mounting hole "${hole.name}" has no finalized PCB geometry`,
    )
  const transform = hole._computePcbGlobalTransformBeforeLayout()
  const tangentLength = Math.hypot(transform.a, transform.b)
  const sign = side === "bottom" ? -1 : 1
  const face: NamedReferencePlane = {
    name: side,
    origin: [geometry.x, geometry.y, (sign * pcbBoard.thickness) / 2],
    normal: [0, 0, sign],
    xAxis: [transform.a / tangentLength, transform.b / tangentLength, 0],
  }
  return { hole, face, subcircuitId: pcbBoard.subcircuit_id }
}
