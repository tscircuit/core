import type { Group } from "../Group"
import type { Port } from "../../Port"
import { getPortForSchematicSymbolPort } from "./getPortForSchematicSymbolPort"
import { asSchematicPortId, type SchematicPortId } from "./port-id-types"

/**
 * Resolve physical-pad schematic representations to their shared symbol
 * terminal. Keep separate components, sheets, and explicitly positioned ports
 * distinct, even when they happen to occupy the same position.
 */
export function createRoutedSchematicPortIdMap(group: Group<any>) {
  const { db } = group.root!
  const routedSchematicPortIdBySchematicPortId = new Map<
    SchematicPortId,
    SchematicPortId
  >()
  for (const port of group.selectAll<Port>("port")) {
    if (!port.schematic_port_id) continue
    const schematicPort = db.schematic_port.get(port.schematic_port_id)
    const terminalPort = getPortForSchematicSymbolPort(port)
    const terminalSchematicPort = terminalPort.schematic_port_id
      ? db.schematic_port.get(terminalPort.schematic_port_id)
      : undefined
    if (
      !schematicPort ||
      !terminalSchematicPort ||
      schematicPort.schematic_component_id !==
        terminalSchematicPort.schematic_component_id ||
      schematicPort.schematic_sheet_id !==
        terminalSchematicPort.schematic_sheet_id
    )
      continue
    routedSchematicPortIdBySchematicPortId.set(
      asSchematicPortId(schematicPort.schematic_port_id),
      asSchematicPortId(terminalSchematicPort.schematic_port_id),
    )
  }
  return routedSchematicPortIdBySchematicPortId
}
