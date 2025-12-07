import type { AnyCircuitElement, PcbComponent, PcbBoard } from "circuit-json"
import type { NormalComponent } from "./NormalComponent"
import { transformPCBElements } from "@tscircuit/circuit-json-util"
import { translate } from "transformation-matrix"

const isDescendantGroup = (
  db: any,
  groupId: string,
  ancestorId: string,
): boolean => {
  if (groupId === ancestorId) return true
  const g = db.source_group.get(groupId)
  return g?.parent_source_group_id
    ? isDescendantGroup(db, g.parent_source_group_id, ancestorId)
    : false
}

const collectPcbElementsForGroup = (
  db: any,
  rootGroupId: string,
): AnyCircuitElement[] => {
  return db.toArray().filter((elm: AnyCircuitElement) => {
    if (!elm.type.startsWith("pcb_")) return false

    // Direct group match
    if ("source_group_id" in elm && elm.source_group_id) {
      if (isDescendantGroup(db, elm.source_group_id, rootGroupId)) return true
    }

    // Via source_component
    if ("source_component_id" in elm && elm.source_component_id) {
      const sc = db.source_component.get(elm.source_component_id)
      if (
        sc?.source_group_id &&
        isDescendantGroup(db, sc.source_group_id, rootGroupId)
      ) {
        return true
      }
    }

    // Via pcb_component → source_component
    if ("pcb_component_id" in elm && elm.pcb_component_id) {
      const pcb = db.pcb_component.get(elm.pcb_component_id) as
        | PcbComponent
        | undefined
      const sc = pcb?.source_component_id
        ? db.source_component.get(pcb.source_component_id)
        : null
      if (
        sc?.source_group_id &&
        isDescendantGroup(db, sc.source_group_id, rootGroupId)
      ) {
        return true
      }
    }

    return false
  })
}

const calculateDelta = (
  from: { x: number; y: number },
  to: { x: number; y: number },
) => ({
  dx: to.x - from.x,
  dy: to.y - from.y,
})

const moveElementsByDelta = (
  elements: AnyCircuitElement[],
  dx: number,
  dy: number,
) => {
  if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
    transformPCBElements(elements, translate(dx, dy))
  }
}

export const NormalComponent__repositionOnPcb = (
  component: NormalComponent,
  position: { x: number; y: number },
): void => {
  const { db } = component.root!

  //
  // 1. Simple PCB component
  //
  if (component.pcb_component_id) {
    const pcb = db.pcb_component.get(component.pcb_component_id) as
      | PcbComponent
      | undefined
    if (!pcb) return

    const { dx, dy } = calculateDelta(pcb.center, position)
    const related = db
      .toArray()
      .filter(
        (e: AnyCircuitElement) =>
          "pcb_component_id" in e &&
          e.pcb_component_id === component.pcb_component_id,
      )

    moveElementsByDelta(related, dx, dy)
    return
  }

  //
  // 2. PCB Board
  //
  const boardId = (component as { pcb_board_id?: string }).pcb_board_id
  if (boardId) {
    const board = db.pcb_board.get(boardId) as PcbBoard | undefined
    if (!board) return

    const rootGroupId = component.source_group_id
    if (!rootGroupId)
      throw new Error(
        `Cannot reposition board ${component.getString()}: no source_group_id`,
      )

    const { dx, dy } = calculateDelta(board.center, position)
    const elements = collectPcbElementsForGroup(db, rootGroupId)
    elements.push(board)

    moveElementsByDelta(elements, dx, dy)
    return
  }

  //
  // 3. PCB Group
  //
  if (component.source_group_id) {
    const group = db.pcb_group
      .list()
      .find((g: any) => g.source_group_id === component.source_group_id)
    if (!group)
      throw new Error(
        `Cannot reposition component ${component.getString()}: no pcb_group found`,
      )

    const { dx, dy } = calculateDelta(group.center, position)
    const elements = collectPcbElementsForGroup(db, component.source_group_id)

    moveElementsByDelta(elements, dx, dy)

    db.pcb_group.update(group.pcb_group_id, { center: position })
    return
  }

  throw new Error(
    `Cannot reposition component ${component.getString()}: no pcb_component_id or source_group_id`,
  )
}
