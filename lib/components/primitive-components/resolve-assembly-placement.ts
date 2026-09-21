import { normalizeDegrees } from "@tscircuit/math-utils"
import type { CadComponent, PcbComponent } from "circuit-json"
import { NormalComponent } from "../base-components/NormalComponent"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyScreen } from "./AssemblyScreen"
import type { AssemblySubassembly } from "./AssemblySubassembly"
import { getAssemblyTarget } from "./get-assembly-target"

type Assembly = AssemblyScreen | AssemblySubassembly

/** Assembly origin in right-handed board-world coordinates: +X right, +Y top,
 * +Z above; position is a point in mm, pcbRotation is degrees around +Z.
 * Bottom-layer orientation uses the same 180-degree Y flip as PCB components.
 */
export interface AssemblyPlacement {
  position: CadComponent["position"]
  pcbRotation: number
  layer: "top" | "bottom"
  subcircuit_id?: PcbComponent["subcircuit_id"]
}

export const isPositionedAssembly = (
  component: PrimitiveComponent,
): component is Assembly =>
  component.componentName === "AssemblyScreen" ||
  component.componentName === "AssemblySubassembly"

export const findParentAssembly = (
  component: PrimitiveComponent,
): Assembly | undefined => {
  let parent = component.parent
  while (parent) {
    if (isPositionedAssembly(parent)) return parent
    if (parent.componentName === "AssemblyDevice" || parent.pcb_component_id)
      return undefined
    parent = parent.parent
  }
  return undefined
}

/** Resolve from finalized PCB geometry rather than CAD render order. No cached
 * transforms: repeated renders and forward references see the current geometry.
 */
export const resolveAssemblyPlacement = (
  component: Assembly,
  path: Assembly[] = [],
): AssemblyPlacement => {
  if (path.includes(component)) {
    throw new Error(
      `Assembly attachment cycle: ${[...path, component].map((item) => item.name).join(" -> ")}`,
    )
  }
  const nextPath = [...path, component]
  const target =
    component.componentName === "AssemblyScreen"
      ? getAssemblyTarget(
          component,
          (component as AssemblyScreen)._parsedProps.connectsTo,
        )
      : findParentAssembly(component)
  if (!target)
    return { position: { x: 0, y: 0, z: 0 }, pcbRotation: 0, layer: "top" }
  if (isPositionedAssembly(target))
    return resolveAssemblyPlacement(target, nextPath)
  const db = component.root!.db
  const targetPcbComponent = db.pcb_component.get(target.pcb_component_id!)
  if (!targetPcbComponent)
    throw new Error(`Assembly target "${target.name}" has no PCB component`)
  const board = target._getBoard()
  if (!board) {
    throw new Error(`Assembly target "${target.name}" is not on a board`)
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
  const pcbRotation = normalizeDegrees(
    insertionAxis && insertionAxisLength > 1e-9
      ? (Math.atan2(-insertionAxis.x, insertionAxis.y) * 180) / Math.PI
      : inferredCableAxisLength > 1e-9
        ? (Math.atan2(-inferredCableAxis.x, inferredCableAxis.y) * 180) /
          Math.PI
        : targetRotation,
  )

  return {
    position: {
      ...cableInsertionCenter,
      z: isBottomLayer ? -boardThickness / 2 : boardThickness / 2,
    },
    pcbRotation,
    layer,
    subcircuit_id: targetPcbComponent.subcircuit_id,
  }
}

export const updateAssemblyPcbPlacement = (
  component: Assembly,
  placement: AssemblyPlacement,
): void => {
  component.root!.db.pcb_component.update(component.pcb_component_id!, {
    center: { x: placement.position.x, y: placement.position.y },
    layer: placement.layer,
    rotation: placement.pcbRotation,
    subcircuit_id: placement.subcircuit_id,
  })
}
