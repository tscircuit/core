import { Port } from "lib/components/primitive-components/Port"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getConnectedPcbPrimitiveClustersBeforeRender } from "lib/components/primitive-components/Port/pcbPrimitiveOverlapBeforeRender"
import { getPortFromHints } from "lib/utils/getPortFromHints"

type PortHintGroup = {
  hints: string[]
  originDescription: string
  component?: PrimitiveComponent
}

/**
 * Converts footprint primitive port hints into logical component ports.
 *
 * Footprints can have multiple copper primitives for one logical pin, for
 * example an SMT pad and a plated hole that both use `portHints={["pin1"]}`.
 * This helper dedupes those primitives by parsed pin number and merges any
 * extra aliases into the first Port for that pin.
 *
 * Example:
 * - inputs: `["pin1"]`, `["pin1", "BAT_POS"]`, `["pin2"]`
 * - output ports: `pin1` with aliases including `BAT_POS`, and `pin2`
 */
export function getLogicalPortsFromPortHintGroups(
  portHintGroups: PortHintGroup[],
  opts?: {
    additionalAliases?: Record<string, string[]>
    inferredInternallyConnectedPinNames?: string[][]
  },
): Port[] {
  let implicitPinNumber = 1
  const entriesByPinNumber = new Map<
    number,
    Array<{ port: Port; component?: PrimitiveComponent }>
  >()

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

    if (!entriesByPinNumber.has(pinNumber))
      entriesByPinNumber.set(pinNumber, [])
    entriesByPinNumber.get(pinNumber)!.push({
      port: newPort,
      component: portHintGroup.component,
    })
  }

  const ports: Port[] = []
  for (const [pinNumber, entries] of entriesByPinNumber) {
    const mergeAliases = (target: Port, source: Port) => {
      const mergedAliases = source
        .getNameAndAliases()
        .filter((alias) => !target.getNameAndAliases().includes(alias))
      target.externallyAddedAliases.push(...mergedAliases)
    }

    const primaryPort = entries[0].port
    const componentEntries = entries.filter(
      (entry): entry is { port: Port; component: PrimitiveComponent } =>
        Boolean(entry.component),
    )

    if (componentEntries.length !== entries.length) {
      for (const entry of entries.slice(1)) {
        mergeAliases(primaryPort, entry.port)
      }
      ports.push(primaryPort)
      continue
    }

    const clusters = getConnectedPcbPrimitiveClustersBeforeRender(
      componentEntries.map((entry) => entry.component),
    )

    if (clusters.length <= 1) {
      for (const entry of entries.slice(1)) {
        mergeAliases(primaryPort, entry.port)
      }
      ports.push(primaryPort)
      continue
    }

    const internallyConnectedPinNames = [primaryPort.props.name!]

    for (const [clusterIndex, cluster] of clusters.entries()) {
      const clusterEntries = componentEntries.filter((entry) =>
        cluster.includes(entry.component),
      )

      if (clusterIndex === 0) {
        for (const entry of clusterEntries.slice(1)) {
          mergeAliases(primaryPort, entry.port)
        }
        ports.push(primaryPort)
        continue
      }

      const internalPort = new Port({
        name: `__pin${pinNumber}_internal_${clusterIndex}`,
        aliases: primaryPort.getNameAndAliases(),
      })
      internalPort._isInferredInternalPhysicalPort = true
      internalPort._inferredPrimaryPinNumber = pinNumber
      internalPort.originDescription = `implicitInternalPhysicalPort:pin${pinNumber}:${clusterIndex}`

      for (const entry of clusterEntries) {
        mergeAliases(internalPort, entry.port)
      }

      internallyConnectedPinNames.push(internalPort.props.name!)
      ports.push(internalPort)
    }

    opts?.inferredInternallyConnectedPinNames?.push(internallyConnectedPinNames)
  }

  const inferredInternalGroups = opts?.inferredInternallyConnectedPinNames ?? []
  const hasInternalGroup = (portNames: string[]) => {
    const sortedPortNames = portNames.toSorted()
    return inferredInternalGroups.some((group) => {
      const sortedGroup = group.toSorted()
      return (
        sortedGroup.length === sortedPortNames.length &&
        sortedGroup.every((name, index) => name === sortedPortNames[index])
      )
    })
  }

  const portsByAlias = new Map<string, Port[]>()
  for (const port of ports) {
    for (const alias of port.getNameAndAliases()) {
      if (/^(pin)?\d+$/.test(alias)) continue
      if (alias.startsWith("__")) continue
      if (!portsByAlias.has(alias)) portsByAlias.set(alias, [])
      portsByAlias.get(alias)!.push(port)
    }
  }

  for (const aliasPorts of portsByAlias.values()) {
    const uniquePorts = Array.from(new Set(aliasPorts))
    if (uniquePorts.length < 2) continue

    const portNames = uniquePorts.map((port) => port.props.name!)
    if (hasInternalGroup(portNames)) continue

    inferredInternalGroups.push(portNames)
  }

  return ports
}
