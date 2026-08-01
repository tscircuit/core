import type { Net } from "lib/components/primitive-components/Net"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import type { Port } from "./Port"

function portIsGround(port: Port): boolean {
  for (const pinAttributes of port._getMatchingPinAttributes()) {
    if (
      pinAttributes.requiresGround === true ||
      pinAttributes.providesGround === true
    ) {
      return true
    }
  }

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

/** Returns true when this port's trace terminates at a ground port or net. */
export function Port_isConnectedToGround(port: Port): boolean {
  for (const connectedTrace of port._getDirectlyConnectedTraces()) {
    const connectedPorts = connectedTrace._findConnectedPorts().ports ?? []
    for (const connectedPort of connectedPorts) {
      if (connectedPort === port) continue
      if (portIsGround(connectedPort)) return true
    }

    for (const connectedNet of connectedTrace._findConnectedNets().nets) {
      if (connectedNet && netIsGround(connectedNet)) return true
    }
  }
  return false
}
