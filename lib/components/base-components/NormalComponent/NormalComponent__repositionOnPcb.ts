import type { NormalComponent } from "./NormalComponent"
import type { AnyCircuitElement } from "circuit-json"
import {
  repositionPcbComponentTo,
  repositionPcbGroupTo,
  transformPCBElements,
  buildSubtree,
} from "@tscircuit/circuit-json-util"
import { translate } from "transformation-matrix"

/**
 * Reposition this component on the PCB to the specified coordinates
 */
export const NormalComponent__repositionOnPcb = (
  component: NormalComponent,
  position: { x: number; y: number },
): void => {
  const { db } = component.root!
  const allCircuitJson = db.toArray()

  // For regular components, reposition PCB component
  if (component.pcb_component_id) {
    repositionPcbComponentTo(
      allCircuitJson,
      component.pcb_component_id,
      position,
    )
    return
  }

  const boardComponent = component as { pcb_board_id?: string | null }
  if (boardComponent.pcb_board_id) {
    const pcbBoard = db.pcb_board.get(boardComponent.pcb_board_id)
    if (pcbBoard) {
      const currentCenter = pcbBoard.center
      const dx = position.x - currentCenter.x
      const dy = position.y - currentCenter.y

      // If no movement needed, skip
      if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
        return
      }

      if (!component.source_group_id) {
        throw new Error(
          `Cannot reposition board ${component.getString()}: no source_group_id`,
        )
      }

      const subtreeElements = buildSubtree(allCircuitJson, {
        source_group_id: component.source_group_id,
      })

      // Filter to only PCB elements
      const pcbElementsToMove: AnyCircuitElement[] = subtreeElements.filter(
        (elm) => "pcb_component_id" in elm,
      )

      pcbElementsToMove.push(pcbBoard)

      const matrix = translate(dx, dy)
      transformPCBElements(pcbElementsToMove, matrix)
      return
    }
  }

  // For groups, reposition PCB group
  if (component.source_group_id) {
    repositionPcbGroupTo(allCircuitJson, component.source_group_id, position)
    return
  }

  throw new Error(
    `Cannot reposition component ${component.getString()}: no pcb_component_id or source_group_id`,
  )
}
