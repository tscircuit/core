import { getNetNameFromSourcePorts } from "lib/utils/schematic/getSourcePortNetLabelText"
import { Port } from "../../Port"

/**
 * Gets a reasonable net name for all the ports. This is used when a schematic
 * trace can't be routed.
 */
export const getNetNameFromPorts = (
  connectedPorts: Port[],
): { name: string; wasAssignedDisplayLabel: boolean } => {
  // Are any of these ports connected to a trace with a display label?
  for (const port of connectedPorts) {
    const directlyConnectedTraces = port._getDirectlyConnectedTraces()

    for (const trace of directlyConnectedTraces) {
      const explicitDisplayLabel = trace._getSchematicNetLabelText()
      if (explicitDisplayLabel) {
        return { name: explicitDisplayLabel, wasAssignedDisplayLabel: true }
      }
    }
  }

  const circuitJsonDb = connectedPorts.find((port) => port.root)?.root?.db
  const connectedSourcePortIds = connectedPorts
    .map((port) => port.source_port_id)
    .filter((sourcePortId): sourcePortId is string => Boolean(sourcePortId))
  const fallbackNetName = circuitJsonDb
    ? getNetNameFromSourcePorts(circuitJsonDb, connectedSourcePortIds)
    : connectedPorts
        .map((port) => port._getNetLabelText())
        .filter((name): name is string => Boolean(name))
        .sort((firstName, secondName) =>
          firstName.localeCompare(secondName, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        )[0]

  return { name: fallbackNetName ?? "", wasAssignedDisplayLabel: false }
}
