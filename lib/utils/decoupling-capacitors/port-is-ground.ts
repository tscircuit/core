import type { PinAttributeMap } from "@tscircuit/props"
import type { Port } from "lib/components/primitive-components/Port"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"

/** Resolves whether a port represents ground from its attributes or labels. */
export const portIsGround = (sourcePort: Port): boolean => {
  const sourceComponent = sourcePort.getParentNormalComponent()
  const pinAttributes = sourceComponent?._parsedProps.pinAttributes as
    | Record<string, PinAttributeMap>
    | undefined
  let requiresGround: boolean | undefined
  let providesGround: boolean | undefined

  for (const portName of sourcePort.getNameAndAliases()) {
    const portAttributes = pinAttributes?.[portName]
    if (!portAttributes) continue
    if (portAttributes.requiresGround !== undefined) {
      requiresGround = portAttributes.requiresGround
    }
    if (portAttributes.providesGround !== undefined) {
      providesGround = portAttributes.providesGround
    }
  }

  return (
    requiresGround === true ||
    providesGround === true ||
    sourcePort
      .getNameAndAliases()
      .some((portName) => GROUND_NET_REGEX.test(portName))
  )
}
