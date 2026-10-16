import type { Net } from "lib/components/primitive-components/Net"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import type { Port } from "./Port"
import { resolvePortSourcePinAttributes } from "./resolve-port-source-pin-attributes"

function portIsGround(port: Port): boolean {
  const attributes = resolvePortSourcePinAttributes(port)
  if (
    attributes.requires_ground === true ||
    attributes.provides_ground === true
  )
    return true

  for (const portName of port.getNameAndAliases()) {
    if (GROUND_NET_REGEX.test(portName)) return true
  }
  return false
}

function netIsGround(net: Net): boolean {
  return (
    net._parsedProps.isGroundNet ?? GROUND_NET_REGEX.test(net._parsedProps.name)
  )
}

/** Follow permanent internal contacts to a trace ending at a ground port or net. */
export function Port_isConnectedToGround(port: Port): boolean {
  const internallyConnectedPorts = new Set([
    port,
    ...port._getPortsInternallyConnectedToThisPort(),
  ])
  const traces = new Set(
    [...internallyConnectedPorts].flatMap((connectedPort) =>
      connectedPort._getDirectlyConnectedTraces(),
    ),
  )
  for (const connectedTrace of traces) {
    const connectedPorts = connectedTrace._findConnectedPorts().ports ?? []
    const connectedPortGroup = new Set(
      connectedPorts.flatMap((connectedPort) => [
        connectedPort,
        ...connectedPort._getPortsInternallyConnectedToThisPort(),
      ]),
    )
    for (const connectedPort of connectedPortGroup) {
      if (internallyConnectedPorts.has(connectedPort)) continue
      if (portIsGround(connectedPort)) return true
    }

    for (const connectedNet of connectedTrace._findConnectedNets().nets) {
      if (connectedNet && netIsGround(connectedNet)) return true
    }
  }
  return false
}
