import { Port } from "lib/components/primitive-components/Port"

const hasExactSameMembers = (a: string[], b: string[]): boolean => {
  const sortedA = a.toSorted()
  const sortedB = b.toSorted()

  return (
    sortedA.length === sortedB.length &&
    sortedA.every((name, index) => name === sortedB[index])
  )
}

const getPinNumberedName = (port: Port): string | null =>
  port.getNameAndAliases().find((alias) => /^pin\d+$/.test(alias)) ?? null

const getPortReferenceName = (
  port: Port,
  portNameCounts: Map<string, number>,
): string | null => {
  if (!port._isPrimaryPort && port.props.name) {
    return port.props.name
  }

  if (port.props.name && (portNameCounts.get(port.props.name) ?? 0) <= 1) {
    return port.props.name
  }

  const pinNumberedName = getPinNumberedName(port)
  if (pinNumberedName) return pinNumberedName

  return port.props.name ?? null
}

export function inferInternallyConnectedPinNamesFromPorts(
  ports: Port[],
  inferredInternallyConnectedPinNames: string[][],
): void {
  const portsByAlias = new Map<string, Port[]>()

  for (const port of ports) {
    for (const alias of new Set(port.getNameAndAliases())) {
      if (/^(pin)?\d+$/.test(alias)) continue
      if (!port._isPrimaryPort && alias === port.props.name) {
        continue
      }
      if (!portsByAlias.has(alias)) portsByAlias.set(alias, [])
      portsByAlias.get(alias)!.push(port)
    }
  }

  for (const aliasPorts of portsByAlias.values()) {
    const uniquePorts = Array.from(new Set(aliasPorts))
    if (uniquePorts.length < 2) continue

    const portNameCounts = new Map<string, number>()
    for (const port of uniquePorts) {
      if (!port.props.name) continue
      portNameCounts.set(
        port.props.name,
        (portNameCounts.get(port.props.name) ?? 0) + 1,
      )
    }

    const portNames = uniquePorts
      .map((port) => getPortReferenceName(port, portNameCounts))
      .filter((portName): portName is string => Boolean(portName))
    const uniquePortNames = Array.from(new Set(portNames))

    if (uniquePortNames.length < 2) continue

    if (
      inferredInternallyConnectedPinNames.some((group) =>
        hasExactSameMembers(group, uniquePortNames),
      )
    ) {
      continue
    }

    inferredInternallyConnectedPinNames.push(uniquePortNames)
  }
}
