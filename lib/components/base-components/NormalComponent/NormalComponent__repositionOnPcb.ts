import type { NormalComponent } from "./NormalComponent"
import {
  repositionPcbComponentTo,
  repositionPcbGroupTo,
} from "@tscircuit/circuit-json-util"

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

  // For groups, reposition PCB group
  if ((component as any).source_group_id) {
    repositionPcbGroupTo(
      allCircuitJson,
      (component as any).source_group_id,
      position,
    )
    return
  }

  throw new Error(
    `Cannot reposition component ${component.getString()}: no pcb_component_id or source_group_id`,
  )
}
