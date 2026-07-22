import type { EnclosureApertureInput } from "@tscircuit/create-fdm-enclosure"
import type { ParsedEnclosureCutoutApertureProps } from "@tscircuit/props"
import type { PcbBoard } from "circuit-json"
import type { Board } from "../../normal-components/Board"
import type { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import { getApertureHeight } from "./get-aperture-height"
import { getNearestBoardWall } from "./get-nearest-board-wall"
import { getSolverWall } from "./get-solver-wall"

export interface GetFdmEnclosureSolverInputParams {
  board: Board
  pcbBoard: PcbBoard
  floorThickness: number
}

export const getFdmEnclosureSolverInput = (
  apertureComponent: EnclosureCutoutAperture,
  { board, pcbBoard, floorThickness }: GetFdmEnclosureSolverInputParams,
): EnclosureApertureInput => {
  let owner = apertureComponent.parent
  while (owner && owner !== board && !owner.pcb_component_id) {
    owner = owner.parent
  }

  const pcbComponent = owner?.pcb_component_id
    ? apertureComponent.root?.db.pcb_component.get(owner.pcb_component_id)
    : null
  if (!pcbComponent) {
    throw new Error(
      "<enclosure.cutoutaperture /> must be nested inside a component with a PCB footprint",
    )
  }

  const point = pcbComponent.cable_insertion_center ?? pcbComponent.center
  const boardWall = getNearestBoardWall({ point, board: pcbBoard })
  const aperture =
    apertureComponent._parsedProps as ParsedEnclosureCutoutApertureProps
  const commonInput = {
    wall: getSolverWall(boardWall),
    offset:
      boardWall === "left" || boardWall === "right"
        ? -(point.y - pcbBoard.center.y)
        : point.x - pcbBoard.center.x,
    centerZ:
      floorThickness +
      (pcbBoard.thickness ?? board.boardThickness) +
      getApertureHeight(aperture) / 2,
    margin: aperture.margin,
  }

  switch (aperture.shape) {
    case "pill":
    case "rect":
      return {
        ...commonInput,
        shape: aperture.shape,
        width: aperture.width,
        height: aperture.height,
      }
    case "circle":
      return {
        ...commonInput,
        shape: "circle",
        radius: aperture.radius,
      }
  }
}
