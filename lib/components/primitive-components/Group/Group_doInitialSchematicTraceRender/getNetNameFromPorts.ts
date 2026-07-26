import { getNetNameFromSourcePorts } from "lib/utils/schematic/getSourcePortNetLabelText"
import { Port } from "../../Port"

/**
 * Gets a reasonable net name for all the ports. This is used when a schematic
 * trace can't be routed.
 */
export const getNetNameFromPorts = (
  ports: Port[],
): { name: string; wasAssignedDisplayLabel: boolean } => {
  // Are any of these ports connected to a trace with a display label?
  for (const port of ports) {
    const traces = port._getDirectlyConnectedTraces()

    for (const trace of traces) {
      const displayLabel = trace._getSchematicNetLabelText()
      if (displayLabel) {
        return { name: displayLabel, wasAssignedDisplayLabel: true }
      }
    }
  }

  const db = ports.find((port) => port.root)?.root?.db
  const sourcePortIds = ports
    .map((port) => port.source_port_id)
    .filter((sourcePortId): sourcePortId is string => Boolean(sourcePortId))
  const netName = db
    ? getNetNameFromSourcePorts(db, sourcePortIds)
    : ports
        .map((port) => port._getNetLabelText())
        .filter((name): name is string => Boolean(name))
        .sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
        )[0]

  return { name: netName ?? "", wasAssignedDisplayLabel: false }
}
