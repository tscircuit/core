import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Group } from "../Group"
import { getNetLabelsInSchematicTraceScope } from "./getNetLabelsInSchematicTraceScope"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"

export const getSchematicPortIdsWithAssignedNetLabels = (
  group: Group<any>,
): Set<SchematicPortId> => {
  const schematicPortIdsWithNetLabels = new Set<SchematicPortId>()

  const netLabels = getNetLabelsInSchematicTraceScope(group)

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
