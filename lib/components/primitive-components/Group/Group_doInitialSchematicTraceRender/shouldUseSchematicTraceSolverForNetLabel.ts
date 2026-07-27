import type { NetLabel } from "../../NetLabel"

export const shouldUseSchematicTraceSolverForNetLabel = (
  netLabel: NetLabel,
): boolean => {
  const { schX, schY } = netLabel._parsedProps
  if (schX !== undefined || schY !== undefined) return false

  const { root } = netLabel
  if (!root) return false

  return netLabel._getConnectedPorts().some((port) => {
    if (!port.source_port_id || !port.schematic_port_id) return false

    const connectedSchematicPort = root.db.schematic_port.get(
      port.schematic_port_id,
    )
    if (!connectedSchematicPort) return false

    return root.db.schematic_port
      .list({ source_port_id: port.source_port_id })
      .some(
        (schematicPort) =>
          schematicPort.schematic_port_id !== port.schematic_port_id &&
          schematicPort.schematic_sheet_id ===
            connectedSchematicPort.schematic_sheet_id,
      )
  })
}
