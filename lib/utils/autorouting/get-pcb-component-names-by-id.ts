import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

/**
 * Maps pcb_component_id (what SimpleRouteJson obstacles carry as componentId)
 * to the source component name, so autorouting messages can say "U_MCU"
 * instead of "pcb_component_0".
 */
export const getPcbComponentNamesById = (
  db: CircuitJsonUtilObjects,
): ReadonlyMap<string, string> => {
  const namesById = new Map<string, string>()
  for (const pcbComponent of db.pcb_component.list()) {
    const sourceComponent = db.source_component.get(
      pcbComponent.source_component_id,
    )
    if (sourceComponent?.name) {
      namesById.set(pcbComponent.pcb_component_id, sourceComponent.name)
    }
  }
  return namesById
}
