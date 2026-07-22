import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourcePort } from "circuit-json"

const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })

const getSourcePortOwnerName = (
  db: CircuitJsonUtilObjects,
  sourcePort: SourcePort,
): string | undefined => {
  const sourceComponent = sourcePort.source_component_id
    ? db.source_component.get(sourcePort.source_component_id)
    : undefined
  const sourceGroup = !sourceComponent
    ? db.source_group
        .list()
        .find((group) => group.subcircuit_id === sourcePort.subcircuit_id)
    : undefined

  return sourceComponent?.name ?? sourceGroup?.name
}

export const getSourcePortNetLabelText = (
  db: CircuitJsonUtilObjects,
  sourcePortId: string,
): string | undefined => {
  const sourcePort = db.source_port.get(sourcePortId)
  if (!sourcePort?.name) return undefined

  const ownerName = getSourcePortOwnerName(db, sourcePort)
  if (!ownerName) return undefined

  return `${ownerName}_${sourcePort.name}`
}

export const getNetNameFromSourcePorts = (
  db: CircuitJsonUtilObjects,
  sourcePortIds: string[],
): string | undefined => {
  const sourcePorts = sourcePortIds
    .map((sourcePortId) => db.source_port.get(sourcePortId))
    .filter((sourcePort): sourcePort is SourcePort => Boolean(sourcePort))

  if (sourcePorts.length === 0) return undefined

  const pinCountByComponentId = new Map<string, number>()
  for (const sourcePort of db.source_port.list()) {
    if (!sourcePort.source_component_id) continue
    pinCountByComponentId.set(
      sourcePort.source_component_id,
      (pinCountByComponentId.get(sourcePort.source_component_id) ?? 0) + 1,
    )
  }

  const candidates = sourcePorts
    .map((sourcePort) => {
      const ownerName = getSourcePortOwnerName(db, sourcePort)
      if (!ownerName || !sourcePort.name) return null

      return {
        sourcePort,
        ownerName,
        label: `${ownerName}_${sourcePort.name}`,
        ownerPinCount: sourcePort.source_component_id
          ? (pinCountByComponentId.get(sourcePort.source_component_id) ?? 0)
          : 0,
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    )

  candidates.sort((a, b) => {
    // Prefer a pin on the component with the most pins, then its lower-numbered
    // connected pin (for example, U1_X1 before U1_X2).
    const pinCountDifference = b.ownerPinCount - a.ownerPinCount
    if (pinCountDifference !== 0) return pinCountDifference

    const ownerNameDifference = naturalCompare(a.ownerName, b.ownerName)
    if (ownerNameDifference !== 0) return ownerNameDifference

    const aPinNumber = a.sourcePort.pin_number ?? Number.POSITIVE_INFINITY
    const bPinNumber = b.sourcePort.pin_number ?? Number.POSITIVE_INFINITY
    const pinNumberDifference = aPinNumber - bPinNumber
    if (pinNumberDifference !== 0) return pinNumberDifference

    return naturalCompare(a.sourcePort.name, b.sourcePort.name)
  })

  return candidates[0]?.label
}
