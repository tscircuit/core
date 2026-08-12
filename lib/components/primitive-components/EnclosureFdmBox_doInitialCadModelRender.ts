import {
  type CreateFdmEnclosureInput,
  CreateFdmEnclosureSolver,
} from "@tscircuit/create-fdm-enclosure"
import type { PcbComponent } from "circuit-json"
import { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import type { EnclosureFdmBox } from "./EnclosureFdmBox"
import { getReferencedEnclosureBoard } from "./get-referenced-enclosure-board"

/**
 * Consume the staged solver while preserving Core's published Circuit JSON
 * representation. The complete assembled plan remains one synthetic
 * `cad_component.model_jscad`; typed per-part records arrive in the later schema
 * migration without blocking the geometry/authoring rollout.
 */
export const EnclosureFdmBox_doInitialCadModelRender = (
  component: EnclosureFdmBox,
): void => {
  const root = component.root
  if (
    !root ||
    root.pcbDisabled ||
    !component.source_component_id ||
    !component.pcb_component_id
  ) {
    return
  }

  const { db } = root
  const props = component._parsedProps
  const board = getReferencedEnclosureBoard(component, props.boardRef)
  const pcbBoard = board.pcb_board_id
    ? db.pcb_board.get(board.pcb_board_id)
    : null
  if (!pcbBoard?.width || !pcbBoard.height) {
    throw new Error(
      `Could not resolve dimensions for boardRef "${props.boardRef}"`,
    )
  }

  const boardThickness = pcbBoard.thickness ?? board.boardThickness
  const inputProblem: CreateFdmEnclosureInput = {
    board: {
      width: pcbBoard.width,
      height: pcbBoard.height,
      thickness: boardThickness,
    },
    width: props.width,
    height: props.height,
    depth: props.depth,
    wallThickness: props.wallThickness,
    floorThickness: props.floorThickness,
    lidThickness: props.lidThickness,
    boardClearance: props.boardClearance,
    standoffHeight: props.standoffHeight,
    topHeadroom: props.topHeadroom,
    lidLipDepth: props.lidLipDepth,
    apertures: props.disableCutouts
      ? []
      : board
          .getDescendants()
          .filter(
            (descendant): descendant is EnclosureCutoutAperture =>
              descendant instanceof EnclosureCutoutAperture,
          )
          .map((aperture) =>
            aperture.getFdmEnclosureSolverInput({ board, pcbBoard }),
          ),
  }

  const solver = new CreateFdmEnclosureSolver(inputProblem)
  const solverConstructorArgs = solver.getConstructorParams()
  root.emit("solver:started", {
    type: "solver:started",
    solverName: "CreateFdmEnclosureSolver",
    solverParams: solverConstructorArgs[0],
    solverConstructorArgs,
    componentName: component.getString(),
  })
  solver.solve()
  if (solver.failed) {
    throw new Error(solver.error ?? "Failed to create FDM enclosure")
  }

  const output = solver.getOutput()
  db.pcb_component.update(component.pcb_component_id, {
    center: pcbBoard.center,
    width: output.dimensions.width,
    height: output.dimensions.height,
  } as Partial<PcbComponent>)

  const position = {
    x: pcbBoard.center.x,
    y: pcbBoard.center.y,
    z:
      -boardThickness / 2 -
      output.dimensions.floorThickness -
      output.dimensions.standoffHeight,
  }

  // Existing Circuit JSON already permits several cad_component records to
  // share one PCB owner (the same relationship a cadassembly uses). Emit the
  // solver's base and lid plans separately now, while both still share the
  // synthetic enclosure source/PCB compatibility owner. The later typed schema
  // adds durable base/lid role names; this stage gives renderers two meshes but
  // intentionally does not infer a role from IDs or names.
  const cadComponents = output.parts.map((part) =>
    db.cad_component.insert({
      position,
      rotation: { x: 0, y: 0, z: 0 },
      pcb_component_id: component.pcb_component_id!,
      source_component_id: component.source_component_id!,
      model_jscad: part.jscadPlan,
      model_unit_to_mm_scale_factor: 1,
      model_object_fit: "contain_within_bounds",
      model_origin_alignment: "bottom_center_of_component",
      anchor_alignment: "center",
      show_as_translucent_model: false,
      show_hidden_edges: props.showHiddenEdges,
    }),
  )
  // PrimitiveComponent exposes one compatibility id; keep the first generated
  // part there while the database remains the source of truth for both records.
  component.cad_component_id = cadComponents[0]?.cad_component_id ?? null
}
