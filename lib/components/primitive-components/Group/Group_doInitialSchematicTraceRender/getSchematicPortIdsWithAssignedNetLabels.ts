import type { NetLabel } from "../../NetLabel"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"

const getSchematicPortIdsForNetLabels = (
  netLabels: NetLabel[],
): Set<SchematicPortId> => {
  const schematicPortIdsWithNetLabels = new Set<SchematicPortId>()

  for (const netLabel of netLabels) {
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

export const getSchematicPortIdsWithAssignedNetLabels = (
  netLabels: NetLabel[],
): Set<SchematicPortId> => getSchematicPortIdsForNetLabels(netLabels)

export const getSchematicPortIdsWithManuallyPositionedNetLabels = (
  netLabels: NetLabel[],
): Set<SchematicPortId> =>
  getSchematicPortIdsForNetLabels(
    netLabels.filter(({ _parsedProps: { schX, schY } }) => {
      return schX !== undefined || schY !== undefined
    }),
  )
