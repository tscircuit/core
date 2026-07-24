import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { NetLabel } from "../../NetLabel"
import type { Group } from "../Group"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"

export const getSchematicPortIdsWithAssignedNetLabels = (
  group: Group<any>,
): Set<SchematicPortId> => {
  const schematicPortIdsWithNetLabels = new Set<SchematicPortId>()

  const netLabels = group.selectAll("netlabel") as NetLabel[]

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
