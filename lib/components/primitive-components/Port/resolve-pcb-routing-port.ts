import type { Port } from "./Port"

export const resolvePcbRoutingPort = (
  port: Port,
  visitedPorts = new Set<Port>(),
): Port => {
  if (!port.isGroupPort()) return port
  if (visitedPorts.has(port)) {
    throw new Error(`Circular group port connection involving ${port}`)
  }

  visitedPorts.add(port)
  const connectedPorts = port._getConnectedPortsFromConnectsTo()
  const connectedPort =
    connectedPorts.find(
      (candidate) =>
        candidate.pcb_port_id && candidate._hasMatchedPcbPrimitive(),
    ) ?? connectedPorts[0]
  if (!connectedPort) return port

  return resolvePcbRoutingPort(connectedPort, visitedPorts)
}
