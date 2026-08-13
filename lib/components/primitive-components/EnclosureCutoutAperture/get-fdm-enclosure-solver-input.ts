import type {
  EnclosureApertureInput,
  EnclosureFace,
} from "@tscircuit/create-fdm-enclosure"
import type { ParsedEnclosureCutoutApertureProps } from "@tscircuit/props"
import type { CadComponent, PcbBoard } from "circuit-json"
import type { Board } from "../../normal-components/Board"
import type { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import { getComponentBody } from "./get-component-body"
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
 * placement. This layer adds component bodies, offsets and explicit depth;
 * the continuous cutout aperture axis is added by the next stacked layer.
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

  const boardSide: "top" | "bottom" =
    pcbComponent.layer === "bottom" ? "bottom" : "top"
  const cadComponent = (apertureComponent.root?.db.cad_component.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
  }) ?? null) as CadComponent | null
  const boardSurfaceZ =
    (boardSide === "bottom" ? -1 : 1) *
    ((pcbBoard.thickness ?? board.boardThickness) / 2)
  const componentBody = getComponentBody({
    owner,
    pcbComponent,
    cadComponent,
    boardSurfaceZ,
  })

  const commonInput = {
    face,
    center,
    boardSide,
    rotation: pcbComponent.rotation ?? undefined,
    depth: aperture.depth,
    componentBody,
    widthDimensionOffset: aperture.widthDimensionOffset,
    heightDimensionOffset: aperture.heightDimensionOffset,
    margin: aperture.margin,
  }

  switch (aperture.shape) {
    case "circle":
      return { ...commonInput, shape: "circle", radius: aperture.radius }
    case "pill":
      return {
        ...commonInput,
        shape: "pill",
        width: aperture.width,
        height: aperture.height,
      }
    case "rect":
      return {
        ...commonInput,
        shape: "rect",
        width: aperture.width,
        height: aperture.height,
      }
  }
}
