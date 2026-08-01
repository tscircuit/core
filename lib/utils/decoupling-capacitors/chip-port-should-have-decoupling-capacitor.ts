import type { PinAttributeMap } from "@tscircuit/props"
import type { Port } from "lib/components/primitive-components/Port"
import { POWER_NET_REGEX } from "lib/utils/gnd-power-net-regex"

/**
 * Resolves whether a chip port should be decoupled, honoring an explicit
 * opt-out before requiresPower and common power-pin label inference.
 */
export const chipPortShouldHaveDecouplingCapacitor = (
  sourcePort: Port,
): boolean => {
  const sourceComponent = sourcePort.getParentNormalComponent()
  if (sourceComponent?.config.componentName !== "Chip") return false

  const pinAttributes = sourceComponent._parsedProps.pinAttributes as
    | Record<string, PinAttributeMap>
    | undefined
  let shouldHaveDecouplingCapacitor: boolean | undefined
  let requiresPower: boolean | undefined
  let providesPower: boolean | undefined

  for (const portName of sourcePort.getNameAndAliases()) {
    const portAttributes = pinAttributes?.[portName]
    if (!portAttributes) continue
    if (portAttributes.shouldHaveDecouplingCapacitor !== undefined) {
      shouldHaveDecouplingCapacitor =
        portAttributes.shouldHaveDecouplingCapacitor
    }
    if (portAttributes.requiresPower !== undefined) {
      requiresPower = portAttributes.requiresPower
    }
    if (portAttributes.providesPower !== undefined) {
      providesPower = portAttributes.providesPower
    }
  }

  if (shouldHaveDecouplingCapacitor !== undefined) {
    return shouldHaveDecouplingCapacitor
  }
  if (requiresPower !== undefined) return requiresPower
  if (providesPower === true) return false

  return sourcePort
    .getNameAndAliases()
    .some((portName) => POWER_NET_REGEX.test(portName))
}
