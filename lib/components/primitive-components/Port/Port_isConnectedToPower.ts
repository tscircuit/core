import { POWER_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import type { Port } from "./Port"

function portShouldHaveDecouplingCapacitor(port: Port): boolean {
  if (port.getParentNormalComponent()?.config.componentName !== "Chip") {
    return false
  }

  let shouldHaveDecouplingCapacitor: boolean | undefined
  let requiresPower: boolean | undefined
  let providesPower: boolean | undefined

  for (const pinAttributes of port._getMatchingPinAttributes()) {
    if (pinAttributes.shouldHaveDecouplingCapacitor !== undefined) {
      shouldHaveDecouplingCapacitor =
        pinAttributes.shouldHaveDecouplingCapacitor
    }
    if (pinAttributes.requiresPower !== undefined) {
      requiresPower = pinAttributes.requiresPower
    }
    if (pinAttributes.providesPower !== undefined) {
      providesPower = pinAttributes.providesPower
    }
  }

  if (shouldHaveDecouplingCapacitor !== undefined) {
    return shouldHaveDecouplingCapacitor
  }
  if (requiresPower !== undefined) return requiresPower
  if (providesPower === true) return false

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
