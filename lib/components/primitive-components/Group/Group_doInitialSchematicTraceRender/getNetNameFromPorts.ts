import { Port } from "../../Port"

/**
 * Gets a reasonable net name for all the ports. This is used when a schematic
 * trace can't be routed.
 */
export const getNetNameFromPorts = (ports: Port[]): string => {
  // Are any of these ports connected to a trace with a display label?
  for (const port of ports) {
    const traces = port._getDirectlyConnectedTraces()

    for (const trace of traces) {
      const displayLabel = trace._parsedProps.schDisplayLabel
      if (displayLabel) {
        return displayLabel
      }
    }
  }

  const netName = ports.map((p) => p._getNetLabelText()).join("/")
  return netName
}
