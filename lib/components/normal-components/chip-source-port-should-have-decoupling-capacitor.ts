import type { SourcePort } from "circuit-json"
import { POWER_NET_REGEX } from "lib/utils/gnd-power-net-regex"

export const chipSourcePortShouldHaveDecouplingCapacitor = (
  sourcePort: SourcePort,
  sourcePortParentIsChip: boolean,
): boolean => {
  if (!sourcePortParentIsChip) return false

  if (sourcePort.should_have_decoupling_capacitor !== undefined) {
    return sourcePort.should_have_decoupling_capacitor
  }

  return (
    sourcePort.requires_power ??
    sourcePort.port_hints?.some((portHint) => POWER_NET_REGEX.test(portHint)) ??
    false
  )
}
