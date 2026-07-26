import {
  type CreateFdmEnclosureInput,
  CreateFdmEnclosureSolver,
} from "@tscircuit/create-fdm-enclosure"
import type { PcbComponent } from "circuit-json"
import { EnclosureCutoutAperture } from "./EnclosureCutoutAperture"
import type { EnclosureFdmBox } from "./EnclosureFdmBox"
import { getReferencedEnclosureBoard } from "./get-referenced-enclosure-board"

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
    apertures: board
      .getDescendants()
      .filter(
        (descendant): descendant is EnclosureCutoutAperture =>
          descendant instanceof EnclosureCutoutAperture,
      )
      .map((aperture) =>
        aperture.getFdmEnclosureSolverInput({
          board,
          pcbBoard,
          floorThickness: props.wallThickness,
        }),
      ),
  }

  const solver = new CreateFdmEnclosureSolver(inputProblem)
  root.emit("solver:started", {
    type: "solver:started",
    solverName: "CreateFdmEnclosureSolver",
    solverParams: solver.getConstructorParams()[0],
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

  const cadComponent = db.cad_component.insert({
    position: {
      x: pcbBoard.center.x,
      y: pcbBoard.center.y,
      z: -boardThickness / 2 - output.dimensions.floorThickness,
    },
    rotation: { x: 0, y: 0, z: 0 },
    pcb_component_id: component.pcb_component_id,
    source_component_id: component.source_component_id,
    model_jscad: output.jscadPlan,
    model_unit_to_mm_scale_factor: 1,
    model_object_fit: "contain_within_bounds",
    model_origin_alignment: "bottom_center_of_component",
    anchor_alignment: "center",
    show_as_translucent_model: false,
  })
  component.cad_component_id = cadComponent.cad_component_id
}
