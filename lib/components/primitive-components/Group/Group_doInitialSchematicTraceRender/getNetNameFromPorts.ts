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
      const displayLabel = trace._parsedProps.schDisplayLabel
      if (displayLabel) {
        return { name: displayLabel, wasAssignedDisplayLabel: true }
      }
    }
  }

  const netName = ports.map((p) => p._getNetLabelText()).join("/")
  return { name: netName, wasAssignedDisplayLabel: false }
}
