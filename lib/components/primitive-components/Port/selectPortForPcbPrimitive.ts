import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Port } from "./Port"
import { doPcbPrimitivesOverlapBeforeRender } from "./pcbPrimitiveOverlapBeforeRender"

const getPinNumberFromHints = (
  hints: Array<string | number>,
): number | null => {
  for (const hint of hints) {
    const normalizedHint = hint.toString()
    if (!/^(pin)?\d+$/.test(normalizedHint)) continue
    return Number.parseInt(normalizedHint.replace(/^pin/, ""))
  }
  return null
}

export function selectPortForPcbPrimitive(
  ports: Port[],
  primitive: PrimitiveComponent,
  hints: Array<string | number>,
): Port | null {
  const pinNumber = getPinNumberFromHints(hints)
  const matchingPorts = ports.filter((port) => port.isMatchingAnyOf(hints))
  if (matchingPorts.length === 0) return null

  const pinMatchedPorts =
    pinNumber === null
      ? matchingPorts
      : matchingPorts.filter(
          (port) =>
            port._parsedProps.pinNumber === pinNumber ||
            port._inferredPrimaryPinNumber === pinNumber,
        )
  const candidates =
    pinMatchedPorts.length > 0 ? pinMatchedPorts : matchingPorts

  const overlappingPort = candidates.find((port) =>
    port.matchedComponents.some(
      (component) =>
        component.isPcbPrimitive &&
        doPcbPrimitivesOverlapBeforeRender(component, primitive),
    ),
  )
  if (overlappingPort) return overlappingPort

  const unmatchedPort = candidates.find(
    (port) =>
      !port.matchedComponents.some((component) => component.isPcbPrimitive),
  )
  return unmatchedPort ?? candidates[0]
}
