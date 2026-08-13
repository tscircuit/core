import type {
  EnclosureApertureInput,
  EnclosureFace,
} from "@tscircuit/create-fdm-enclosure"
import type { ParsedEnclosureCutoutApertureProps } from "@tscircuit/props"
import type { CadComponent, PcbBoard, PcbComponent } from "circuit-json"
import type { Board } from "../../normal-components/Board"
import type { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import { getComponentBody } from "./get-component-body"
import { getNearestBoardWall } from "./get-nearest-board-wall"
import type { BoardWall } from "./get-nearest-board-wall"

/**
 * `insertion_direction` names the board edge a part is reached from, and board
 * walls are named for the same axes, so this is a straight correspondence.
 *
 * Keyed on the canonical Circuit JSON names only. The deprecated `from_front`
 * and `from_back` are normalized away on parse and are never present on an
 * emitted `pcb_component`.
 */
const INSERTION_DIRECTION_TO_BOARD_WALL: Record<string, BoardWall> = {
  from_top: "y_pos",
  from_bottom: "y_neg",
  from_left: "x_neg",
  from_right: "x_pos",
}
import { getSolverWall } from "./get-solver-wall"

export interface GetFdmEnclosureSolverInputParams {
  board: Board
  pcbBoard: PcbBoard
}

export const getFdmEnclosureSolverInput = (
  apertureComponent: EnclosureCutoutAperture,
  { board, pcbBoard }: GetFdmEnclosureSolverInputParams,
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

  const aperture =
    apertureComponent._parsedProps as ParsedEnclosureCutoutApertureProps

  const apertureDirectionOwner = owner as typeof owner & {
    _getEnclosureApertureAxisDirection?: (
      componentLayer: PcbComponent["layer"],
      rotationDegrees: number,
    ) => { x: number; y: number; z: number } | undefined
  }
  // Props are staged before the durable Circuit JSON direction field. Read the
  // transformed component-owned axis directly for now; once the schema lands,
  // Core will additionally emit its quantized name on pcb_component.
  const apertureAxisDirection =
    apertureDirectionOwner?._getEnclosureApertureAxisDirection?.(
      pcbComponent.layer,
      pcbComponent.rotation ?? 0,
    )
  const apertureDirection = apertureAxisDirection
    ? apertureAxisDirection.z !== 0
      ? apertureAxisDirection.z > 0
        ? "from_above"
        : "from_below"
      : Math.abs(apertureAxisDirection.x) >= Math.abs(apertureAxisDirection.y)
        ? apertureAxisDirection.x >= 0
          ? "from_right"
          : "from_left"
        : apertureAxisDirection.y >= 0
          ? "from_top"
          : "from_bottom"
    : pcbComponent.insertion_direction

  // A part that mates along Z exits through a horizontal face. Which one is
  // carried by the direction itself: `transformFootprintInsertionDirection`
  // inverts Z on a layer flip, because moving to the other layer is a 180
  // degree rotation about the board's Y axis. So a footprint authored
  // `from_above` reports `from_below` when mounted on the bottom layer, and its
  // aperture pierces the floor rather than the lid.
  //
  // Reading the face off the direction rather than off the mounting layer also
  // honours a part that explicitly declares the opposite side.
  const verticalFace: EnclosureFace | undefined =
    apertureDirection === "from_above"
      ? "z_pos"
      : apertureDirection === "from_below"
        ? "z_neg"
        : undefined
  // Sets the datum for heightDimensionOffset. This one stays `top`/`bottom` because
  // it names a PCB layer, which is a Z-side concept, not a face.
  const boardSide: "top" | "bottom" =
    pcbComponent.layer === "bottom" ? "bottom" : "top"

  let face: EnclosureFace
  let center: { x: number; y: number }

  if (verticalFace) {
    face = verticalFace
    // Vertical apertures are centered on the component itself. No inference is
    // involved: `cable_insertion_center` is connector-specific, and a button or
    // LED sits exactly at its own placement.
    center = {
      x: pcbComponent.center.x - pcbBoard.center.x,
      y: pcbComponent.center.y - pcbBoard.center.y,
    }
  } else {
    const point = pcbComponent.cable_insertion_center ?? pcbComponent.center
    // The named direction is the nearest Cartesian wall to the physical axis,
    // already rotated out of the footprint frame and mirrored for the layer. It
    // is an initial face choice; with a continuous axis the enclosure resolves
    // the first wall that ray actually intersects, which can differ near a
    // corner. Nearest-edge is only consulted when the footprint declares no
    // direction, where a guess beats no aperture at all.
    const boardWall =
      INSERTION_DIRECTION_TO_BOARD_WALL[
        apertureDirection as keyof typeof INSERTION_DIRECTION_TO_BOARD_WALL
      ] ?? getNearestBoardWall({ point, board: pcbBoard })
    const cableDelta = pcbComponent.cable_insertion_center
      ? {
          x: pcbComponent.cable_insertion_center.x - pcbComponent.center.x,
          y: pcbComponent.cable_insertion_center.y - pcbComponent.center.y,
        }
      : null
    const cableProjectionMatchesWall =
      cableDelta != null &&
      (boardWall === "x_neg" || boardWall === "x_pos"
        ? Math.abs(cableDelta.x) >= Math.abs(cableDelta.y)
        : Math.abs(cableDelta.y) >= Math.abs(cableDelta.x))
    // A declared direction gives the enclosure a physical axis. Its stable datum
    // is the same component centre the body rotates around. The inferred
    // `cable_insertion_center` is chosen from one side of the component's
    // axis-aligned bounds; when direction quantization switches sides near a
    // corner, that point jumps discontinuously and is not on the rotated body
    // axis. It remains useful only for the no-direction nearest-edge fallback.
    const tangentPoint = apertureAxisDirection
      ? pcbComponent.center
      : cableProjectionMatchesWall
        ? point
        : pcbComponent.center
    face = getSolverWall(boardWall)
    center = {
      x: tangentPoint.x - pcbBoard.center.x,
      y: tangentPoint.y - pcbBoard.center.y,
    }
  }

  // The physical envelope of the part. Core reports the facts; the enclosure
  // package projects them onto the face normal to decide how far inboard the cut
  // must reach. An authored `depth` still wins outright, so the
  // envelope is only supplied when there is nothing authored to respect.
  // Read off the emitted record rather than the owner's props: that is the
  // normalized form every authoring path converges on, and it already carries
  // the composed rotation and Z datum. `EnclosureRender` runs after
  // `CadModelRender` precisely so this exists by now, whichever order the board
  // and the enclosure were declared in.
  // Looked up by `pcb_component_id` rather than the owner's `cad_component_id`,
  // because a `<cadmodel>` child owns the record itself -- the component only
  // holds an id when it emitted one from its own props.
  const cadComponent = (apertureComponent.root?.db.cad_component.getWhere({
    pcb_component_id: pcbComponent.pcb_component_id,
  }) ?? null) as CadComponent | null
  const boardSurfaceZ =
    (boardSide === "bottom" ? -1 : 1) *
    ((pcbBoard.thickness ?? board.boardThickness) / 2)
  // Always supplied. It used to be withheld when a depth was authored, but the
  // solver already prefers an authored depth over the envelope, and placement
  // now needs the body too: a side-face opening is centred on the part's reach
  // above the board. Withholding it would silently fall back to centring on the
  // opening's own height.
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
    /**
     * Unit direction in board XYZ (+Z above the board), not a translated point.
     * `create-fdm-enclosure` measures it against the selected face normal to get
     * the exact signed incidence angle.
     */
    apertureAxisDirection,
    // A lid/floor aperture is authored in the footprint frame, so its in-plane
    // roll follows the PCB component -- the same transform as pads and
    // silkscreen. Never use `cadComponent.rotation.z` here: it also contains the
    // model asset's `pcbRotationOffset`, and on the bottom layer its Z scalar is
    // negated as one part of a full 3D Y-flip. Applying that scalar alone to a
    // 2D aperture made a 45-degree floor slot rotate to -45 degrees. CAD
    // rotation remains correct for `componentBody`, whose bounds are model-local.
    // Side faces use `apertureAxisDirection` instead; there the board-Z rotation
    // is an approach angle rather than roll within the wall.
    rotation: pcbComponent.rotation ?? undefined,
    depth: aperture.depth,
    componentBody,
    // Left undefined when unauthored: `create-fdm-enclosure` owns where an
    // opening sits by default -- centred on the part's body -- so the placement
    // arithmetic lives with the aperture geometry, not in core.
    widthDimensionOffset: aperture.widthDimensionOffset,
    heightDimensionOffset: aperture.heightDimensionOffset,
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
