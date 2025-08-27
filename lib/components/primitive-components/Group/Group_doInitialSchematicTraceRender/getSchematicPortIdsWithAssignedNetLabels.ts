import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Group } from "../Group"
import type { NetLabel } from "../../NetLabel"

export const getSchematicPortIdsWithAssignedNetLabels = (group: Group<any>) => {
  const schematicPortIdsWithNetLabels = new Set<string>()

  const netLabels = group.selectAll("netlabel") as NetLabel[]

  for (const netLabel of netLabels) {
    const netLabelPorts = netLabel._getConnectedPorts()
    for (const port of netLabelPorts) {
      if (!port.schematic_port_id) continue
      schematicPortIdsWithNetLabels.add(port.schematic_port_id)
    }
  }

  return schematicPortIdsWithNetLabels
}
