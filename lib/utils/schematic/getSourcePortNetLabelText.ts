import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

export const getSourcePortNetLabelText = (
  db: CircuitJsonUtilObjects,
  sourcePortId: string,
): string | undefined => {
  const sourcePort = db.source_port.get(sourcePortId)
  if (!sourcePort?.name) return undefined

  const sourceComponent = sourcePort.source_component_id
    ? db.source_component.get(sourcePort.source_component_id)
    : undefined
  const sourceGroup = !sourceComponent
    ? db.source_group
        .list()
        .find((group) => group.subcircuit_id === sourcePort.subcircuit_id)
    : undefined
  const ownerName = sourceComponent?.name ?? sourceGroup?.name
  if (!ownerName) return undefined

  return `${ownerName}_${sourcePort.name}`
}

export const getNetNameFromSourcePorts = (
  db: CircuitJsonUtilObjects,
  sourcePortIds: string[],
): string | undefined => {
  const portNames = sourcePortIds
    .map((sourcePortId) => getSourcePortNetLabelText(db, sourcePortId))
    .filter((name): name is string => Boolean(name))

  if (portNames.length === 0) return undefined
  return "NAME?"
}
