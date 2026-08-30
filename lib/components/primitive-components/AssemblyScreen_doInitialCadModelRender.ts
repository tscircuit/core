import { normalizeDegrees } from "@tscircuit/math-utils"
import type { CadComponent, PcbComponent } from "circuit-json"
import { NormalComponent } from "../base-components/NormalComponent"
import type { AssemblyScreen } from "./AssemblyScreen"
import { getAssemblyScreenTarget } from "./get-assembly-screen-target"

const formatMillimetersForModelprinter = (millimeters: number): string =>
  Number(millimeters.toFixed(6)).toString()

const getDefaultFlexScreenModel = (component: AssemblyScreen): string => {
  const { width, height } = component._parsedProps
  if (width === undefined || height === undefined) {
    throw new Error(
      `assembly.screen "${component.name}" requires both width and height when cadModel is omitted`,
    )
  }
  return `flexscreen_w${formatMillimetersForModelprinter(width)}mm_h${formatMillimetersForModelprinter(height)}mm`
}

/**
 * Place a modelprinter FlexScreen in Circuit JSON's board-world frame: +X is
 * right, +Y is toward the board top, +Z is above the top face, angles are
 * degrees, and positions are millimetres. The FlexScreen's local origin is the
 * cable mouth and its local +Y axis follows the cable toward the display.
 */
export const AssemblyScreen_doInitialCadModelRender = (
  component: AssemblyScreen,
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
  const target = getAssemblyScreenTarget(component, props.connectsTo)
  const targetPcbComponent = db.pcb_component.get(target.pcb_component_id!)
  if (!targetPcbComponent) {
    throw new Error(
      `assembly.screen "${component.name}" could not read the PCB component selected by "${props.connectsTo}"`,
    )
  }

  const board = target._getBoard()
  if (!board) {
    throw new Error(
      `assembly.screen "${component.name}" target "${props.connectsTo}" is not on a board`,
    )
  }
  const pcbBoard = board.pcb_board_id
    ? db.pcb_board.get(board.pcb_board_id)
    : null
  const boardThickness = pcbBoard?.thickness ?? board.boardThickness
  const layer = targetPcbComponent.layer === "bottom" ? "bottom" : "top"
  const isBottomLayer = layer === "bottom"
  const targetRotation = targetPcbComponent.rotation ?? 0

  const insertionAxis =
    target instanceof NormalComponent
      ? target._getPcbComponentInsertionAxisDirection(layer, targetRotation)
      : undefined
  const insertionAxisLength = insertionAxis
    ? Math.hypot(insertionAxis.x, insertionAxis.y)
    : 0
  const cableInsertionCenter =
    targetPcbComponent.cable_insertion_center ?? targetPcbComponent.center
  const inferredCableAxis = {
    x: cableInsertionCenter.x - targetPcbComponent.center.x,
    y: cableInsertionCenter.y - targetPcbComponent.center.y,
  }
  const inferredCableAxisLength = Math.hypot(
    inferredCableAxis.x,
    inferredCableAxis.y,
  )
  const screenBoardRotation = normalizeDegrees(
    insertionAxis && insertionAxisLength > 1e-9
      ? (Math.atan2(-insertionAxis.x, insertionAxis.y) * 180) / Math.PI
      : inferredCableAxisLength > 1e-9
        ? (Math.atan2(-inferredCableAxis.x, inferredCableAxis.y) * 180) /
          Math.PI
        : targetRotation,
  )

  db.pcb_component.update(component.pcb_component_id, {
    center: cableInsertionCenter,
    layer,
    rotation: screenBoardRotation,
    subcircuit_id: targetPcbComponent.subcircuit_id,
  } as Partial<PcbComponent>)

  const cadComponent = db.cad_component.insert({
    position: {
      x: cableInsertionCenter.x,
      y: cableInsertionCenter.y,
      z: isBottomLayer ? -boardThickness / 2 : boardThickness / 2,
    },
    rotation: {
      x: 0,
      y: isBottomLayer ? 180 : 0,
      z: normalizeDegrees(
        isBottomLayer ? -screenBoardRotation : screenBoardRotation,
      ),
    },
    pcb_component_id: component.pcb_component_id,
    source_component_id: component.source_component_id,
    subcircuit_id: targetPcbComponent.subcircuit_id,
    footprinter_string: props.cadModel ?? getDefaultFlexScreenModel(component),
    model_unit_to_mm_scale_factor: 1,
    model_origin_position: { x: 0, y: 0, z: 0 },
    anchor_alignment: "center",
    show_as_translucent_model: false,
  } as CadComponent)

  component.cad_component_id = cadComponent.cad_component_id
}
