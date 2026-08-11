import type {
  EnclosureApertureInput,
  EnclosureFace,
} from "@tscircuit/create-fdm-enclosure"
import type { ParsedEnclosureCutoutApertureProps } from "@tscircuit/props"
import type { PcbBoard } from "circuit-json"
import type { Board } from "../../normal-components/Board"
import type { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import { getNearestBoardWall } from "./get-nearest-board-wall"
import type { BoardWall } from "./get-nearest-board-wall"
import { getSolverWall } from "./get-solver-wall"

const INSERTION_DIRECTION_TO_BOARD_WALL: Record<string, BoardWall> = {
  from_top: "y_pos",
  from_bottom: "y_neg",
  from_left: "x_neg",
  from_right: "x_pos",
}

export interface GetFdmEnclosureSolverInputParams {
  board: Board
  pcbBoard: PcbBoard
}

/**
 * Minimal adapter for the staged solver API.
 *
 * This layer preserves Core's existing insertion-direction/nearest-edge
 * placement. Component bodies, offsets, explicit depth and the continuous
 * cutout aperture axis are added by the next stacked layers.
 */
export const getFdmEnclosureSolverInput = (
  apertureComponent: EnclosureCutoutAperture,
  { board, pcbBoard }: GetFdmEnclosureSolverInputParams,
): EnclosureApertureInput => {
  let owner = apertureComponent.parent
  while (owner && owner !== board && !owner.pcb_component_id)
    owner = owner.parent

  const pcbComponent = owner?.pcb_component_id
    ? apertureComponent.root?.db.pcb_component.get(owner.pcb_component_id)
    : null
  if (!pcbComponent) {
    throw new Error(
      "<enclosure.cutoutaperture /> must be nested inside a component with a PCB footprint",
    )
  }

  const aperture =
    apertureComponent._parsedProps as ParsedEnclosureCutoutApertureProps
  const direction = pcbComponent.insertion_direction
  const verticalFace: EnclosureFace | undefined =
    direction === "from_above"
      ? "z_pos"
      : direction === "from_below"
        ? "z_neg"
        : undefined
  const point = pcbComponent.cable_insertion_center ?? pcbComponent.center
  const face =
    verticalFace ??
    getSolverWall(
      INSERTION_DIRECTION_TO_BOARD_WALL[direction ?? ""] ??
        getNearestBoardWall({ point, board: pcbBoard }),
    )
  const center = verticalFace
    ? {
        x: pcbComponent.center.x - pcbBoard.center.x,
        y: pcbComponent.center.y - pcbBoard.center.y,
      }
    : {
        x: point.x - pcbBoard.center.x,
        y: point.y - pcbBoard.center.y,
      }

  const commonInput = {
    face,
    center,
    boardSide:
      pcbComponent.layer === "bottom" ? ("bottom" as const) : ("top" as const),
    rotation: pcbComponent.rotation ?? undefined,
    margin: aperture.margin,
  }

  if (aperture.shape === "circle") {
    return { ...commonInput, shape: "circle", radius: aperture.radius }
  }
  return {
    ...commonInput,
    shape: aperture.shape,
    width: aperture.width,
    height: aperture.height,
  }
}
