import type { EnclosureWall } from "@tscircuit/create-fdm-enclosure"
import type { BoardWall } from "./get-nearest-board-wall"

export const getSolverWall = (boardWall: BoardWall): EnclosureWall => {
  // circuit-json-to-gltf rotates Z-up JSCAD geometry into Y-up scene space,
  // which reverses local Y relative to Circuit JSON's PCB Y coordinate.
  if (boardWall === "front") return "back"
  if (boardWall === "back") return "front"
  return boardWall
}
