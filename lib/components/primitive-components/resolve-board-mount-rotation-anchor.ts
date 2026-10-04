import type { Board } from "../normal-components/Board/Board"
import { matchesAssemblyIdentity } from "./resolve-board-motor-mount"

/** Circuit-world direction (+X right, +Y top), derived from PCB points in mm. */
export const resolveBoardMountRotationAnchor = (
  board: Board,
): [number, number, number] => {
  const anchor = board._parsedProps.mountRotationAnchor ?? "rightedge"
  const transform = board._computePcbGlobalTransformBeforeLayout()
  switch (anchor) {
    case "rightedge":
      return [transform.a, transform.b, 0]
    case "leftedge":
      return [-transform.a, -transform.b, 0]
    case "topedge":
      return [transform.c, transform.d, 0]
    case "bottomedge":
      return [-transform.c, -transform.d, 0]
  }
  const components = board
    .getDescendants()
    .filter((component) => matchesAssemblyIdentity(component, anchor))
  if (components.length !== 1)
    throw new Error(
      `board "${board.name}" mountRotationAnchor "${anchor}" matched ${components.length} components; expected exactly one on this board`,
    )
  const component = components[0]!
  const pcbComponent =
    component.pcb_component_id &&
    board.root!.db.pcb_component.get(component.pcb_component_id)
  if (!pcbComponent)
    throw new Error(
      `board "${board.name}" mountRotationAnchor "${anchor}" has no PCB component geometry`,
    )
  const pcbBoard = board.root!.db.pcb_board.get(board.pcb_board_id!)!
  const x = pcbComponent.center.x - pcbBoard.center.x
  const y = pcbComponent.center.y - pcbBoard.center.y
  if (Math.hypot(x, y) < 1e-6)
    throw new Error(
      `board "${board.name}" mountRotationAnchor "${anchor}" is on the mounting axis and has no direction`,
    )
  return [x, y, 0]
}
