import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
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

  // A ground pin can also have a BGA ball alias such as V3. Do not mistake
  // that package address for a supply name when following internal contacts.
  const aliases = port.getNameAndAliases()
  if (
    attributes.requires_ground === true ||
    attributes.provides_ground === true ||
    aliases.some((alias) => GROUND_NET_REGEX.test(alias))
  )
    return false
  for (const portName of aliases) {
    if (portName === port.physicalPinName) continue
    if (POWER_NET_REGEX.test(portName)) return true
  }
  return false
}

/**
 * Follow permanent internal contacts to a trace reaching an eligible chip
 * power-input port. Merely sharing a named power net does not qualify.
 */
export function Port_isConnectedToPower(port: Port): boolean {
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
      if (portShouldHaveDecouplingCapacitor(connectedPort)) return true
    }
  }
  return false
}
