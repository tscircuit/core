import { POWER_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import type { Port } from "./Port"
import { resolvePortSourcePinAttributes } from "./resolve-port-source-pin-attributes"

function portShouldHaveDecouplingCapacitor(port: Port): boolean {
  if (port.getParentNormalComponent()?.config.componentName !== "Chip") {
    return false
  }

  const attributes = resolvePortSourcePinAttributes(port)
  if (attributes.should_have_decoupling_capacitor !== undefined) {
    return attributes.should_have_decoupling_capacitor
  }
  if (attributes.requires_power !== undefined) return attributes.requires_power
  if (attributes.provides_power === true) return false

  for (const portName of port.getNameAndAliases()) {
    if (POWER_NET_REGEX.test(portName)) return true
  }
  return false
}

/**
 * Returns true when this port shares a trace directly with an eligible chip
 * power-input port. Merely sharing a named power net does not qualify.
 */
export function Port_isConnectedToPower(port: Port): boolean {
  for (const connectedTrace of port._getDirectlyConnectedTraces()) {
    const connectedPorts = connectedTrace._findConnectedPorts().ports ?? []
    for (const connectedPort of connectedPorts) {
      if (connectedPort === port) continue
      if (portShouldHaveDecouplingCapacitor(connectedPort)) return true
    }
  }
  return false
}
