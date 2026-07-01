import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"

type SchematicPortId = string

export const getPortIdsInsideExpandedTextBounds = (ctx: IsolatedCircuit) => {
  const { db } = ctx
  const eligiblePortIds = new Set<SchematicPortId>()
  for (const schematicComponent of db.schematic_component.list()) {
    if (!getSchematicComponentWithTextBounds(db, schematicComponent)) {
      continue
    }
    for (const port of db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })) {
      eligiblePortIds.add(port.schematic_port_id)
    }
  }
  return eligiblePortIds
}
