import type { Net } from "../../Net"
import type { Port } from "../../Port"

export function getTraceDisplayName({
  ports,
  nets,
}: {
  ports?: { selector: string; port: Port }[]
  nets: Net[]
}): string | undefined {
  // Return connection information if we have both endpoints
  if (ports && ports.length >= 2) {
    return `${ports[0]?.selector} to ${ports[1]?.selector}`
  }
  // Return connection information if we have a port and a net
  if (ports && ports.length === 1 && nets.length === 1) {
    return `${ports[0]?.selector} to net.${nets[0]._parsedProps.name}`
  }
  // Return connection information if we have two nets (net-to-net connection)
  if (nets.length === 2) {
    return `net.${nets[0]._parsedProps.name} to net.${nets[1]._parsedProps.name}`
  }

  return undefined
}
