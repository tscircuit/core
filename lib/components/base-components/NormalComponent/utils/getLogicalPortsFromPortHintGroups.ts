import { Port } from "lib/components/primitive-components/Port"
import { getPortFromHints } from "lib/utils/getPortFromHints"

type PortHintGroup = {
  hints: string[]
  originDescription: string
}

export function getLogicalPortsFromPortHintGroups(
  portHintGroups: PortHintGroup[],
  opts?: { additionalAliases?: Record<string, string[]> },
): Port[] {
  let implicitPinNumber = 1
  const portsByPinNumber = new Map<number, Port>()

  for (const portHintGroup of portHintGroups) {
    const filteredPortHints = portHintGroup.hints.filter(
      (hint) => hint && hint.trim() !== "",
    )

    if (filteredPortHints.length === 0) continue

    let portHintsList = filteredPortHints
    const hasPinIdentifier = portHintsList.some(
      (hint) => hint.startsWith("pin") || /^(?:pin)?\d+$/.test(hint),
    )

    if (!hasPinIdentifier) {
      portHintsList = [...portHintsList, `pin${implicitPinNumber}`]
    }
    implicitPinNumber++

    const newPort = getPortFromHints(portHintsList, opts)
    if (!newPort) continue

    newPort.originDescription = portHintGroup.originDescription

    const pinNumber = newPort._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const existingPort = portsByPinNumber.get(pinNumber)
    if (!existingPort) {
      portsByPinNumber.set(pinNumber, newPort)
      continue
    }

    const mergedAliases = newPort
      .getNameAndAliases()
      .filter((alias) => !existingPort.getNameAndAliases().includes(alias))

    existingPort.externallyAddedAliases.push(...mergedAliases)
  }

  return Array.from(portsByPinNumber.values())
}
