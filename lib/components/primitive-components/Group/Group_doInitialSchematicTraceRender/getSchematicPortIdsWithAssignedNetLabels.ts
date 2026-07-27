import type { NetLabel } from "../../NetLabel"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"

export const getSchematicPortIdsWithAssignedNetLabels = (
  netLabels: NetLabel[],
): Set<SchematicPortId> => {
  const schematicPortIdsWithNetLabels = new Set<SchematicPortId>()

  for (const netLabel of netLabels) {
    const { schX, schY } = netLabel._parsedProps
    if (schX === undefined && schY === undefined) continue

    const netLabelPorts = netLabel._getConnectedPorts()
    for (const port of netLabelPorts) {
      if (!port.schematic_port_id) continue
      schematicPortIdsWithNetLabels.add(
        asSchematicPortId(port.schematic_port_id),
      )
    }
  }

  return schematicPortIdsWithNetLabels
}
