import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourcePort } from "circuit-json"

const compareNamesAlphanumerically = (firstName: string, secondName: string) =>
  firstName.localeCompare(secondName, undefined, {
    numeric: true,
    sensitivity: "base",
  })

const getComponentOrGroupNameForPort = (
  circuitJsonDb: CircuitJsonUtilObjects,
  sourcePort: SourcePort,
): string | undefined => {
  const sourceComponent = sourcePort.source_component_id
    ? circuitJsonDb.source_component.get(sourcePort.source_component_id)
    : undefined
  const sourceGroup = !sourceComponent
    ? circuitJsonDb.source_group
        .list()
        .find((group) => group.subcircuit_id === sourcePort.subcircuit_id)
    : undefined

  return sourceComponent?.name ?? sourceGroup?.name
}

export const getSourcePortNetLabelText = (
  circuitJsonDb: CircuitJsonUtilObjects,
  sourcePortId: string,
): string | undefined => {
  const sourcePort = circuitJsonDb.source_port.get(sourcePortId)
  if (!sourcePort?.name) return undefined

  const componentOrGroupName = getComponentOrGroupNameForPort(
    circuitJsonDb,
    sourcePort,
  )
  if (!componentOrGroupName) return undefined

  return `${componentOrGroupName}_${sourcePort.name}`
}

export const getNetNameFromSourcePorts = (
  circuitJsonDb: CircuitJsonUtilObjects,
  connectedSourcePortIds: string[],
): string | undefined => {
  const connectedSourcePorts = connectedSourcePortIds
    .map((sourcePortId) => circuitJsonDb.source_port.get(sourcePortId))
    .filter((sourcePort): sourcePort is SourcePort => Boolean(sourcePort))

  if (connectedSourcePorts.length === 0) return undefined

  const pinCountByComponentId = new Map<string, number>()
  for (const sourcePort of circuitJsonDb.source_port.list()) {
    if (!sourcePort.source_component_id) continue
    pinCountByComponentId.set(
      sourcePort.source_component_id,
      (pinCountByComponentId.get(sourcePort.source_component_id) ?? 0) + 1,
    )
  }

  const netLabelCandidates = connectedSourcePorts
    .map((sourcePort) => {
      const componentOrGroupName = getComponentOrGroupNameForPort(
        circuitJsonDb,
        sourcePort,
      )
      if (!componentOrGroupName || !sourcePort.name) return null

      return {
        sourcePort,
        componentOrGroupName,
        labelText: `${componentOrGroupName}_${sourcePort.name}`,
        componentPinCount: sourcePort.source_component_id
          ? (pinCountByComponentId.get(sourcePort.source_component_id) ?? 0)
          : 0,
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    )

  netLabelCandidates.sort((firstCandidate, secondCandidate) => {
    // Prefer a pin on the component with the most pins, then its lower-numbered
    // connected pin (for example, U1_X1 before U1_X2).
    const componentPinCountDifference =
      secondCandidate.componentPinCount - firstCandidate.componentPinCount
    if (componentPinCountDifference !== 0) return componentPinCountDifference

    const componentNameDifference = compareNamesAlphanumerically(
      firstCandidate.componentOrGroupName,
      secondCandidate.componentOrGroupName,
    )
    if (componentNameDifference !== 0) return componentNameDifference

    const firstPinNumber =
      firstCandidate.sourcePort.pin_number ?? Number.POSITIVE_INFINITY
    const secondPinNumber =
      secondCandidate.sourcePort.pin_number ?? Number.POSITIVE_INFINITY
    const pinNumberDifference = firstPinNumber - secondPinNumber
    if (pinNumberDifference !== 0) return pinNumberDifference

    return compareNamesAlphanumerically(
      firstCandidate.sourcePort.name,
      secondCandidate.sourcePort.name,
    )
  })

  return netLabelCandidates[0]?.labelText
}
