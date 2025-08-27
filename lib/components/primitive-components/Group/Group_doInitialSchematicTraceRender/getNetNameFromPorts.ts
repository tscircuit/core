import { Port } from "../../Port"

/**
 * Gets a reasonable net name for all the ports. This is used when a schematic
 * trace can't be routed.
 */
export const getNetNameFromPorts = (ports: Port[]): string => {
  const netName = ports.map((p) => p._getNetLabelText()).join("/")
  return netName
}
