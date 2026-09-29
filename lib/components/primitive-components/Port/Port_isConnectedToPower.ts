import type { Port } from "./Port"

// POWER_NET_REGEX classifies power nets, including output rails. Here we need
// supply-input pins that should have nearby decoupling, not reference, bias,
// or output pins such as VREG, VCM, and VOUT. pinAttributes remain authoritative.
const DECOUPLING_POWER_PIN_REGEX =
  /(?:^|_)(?:[ADP]?V(?:CC|DD|IN|BAT|BUS|SYS|CORE|IO)[A-Z0-9_]*|V\d+(?:_\d+)?|\d+V\d*)(?:$|_)/i

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
    if (DECOUPLING_POWER_PIN_REGEX.test(portName)) return true
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
