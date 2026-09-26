import type { InflatorContext } from "../InflatorFn"

export function isSchematicProxySourceComponent(
  sourceComponentId: string,
  inflatorContext: InflatorContext,
): boolean {
  const { injectionDb } = inflatorContext
  const hasSourcePorts = injectionDb.source_port
    .list()
    .some((sourcePort) => sourcePort.source_component_id === sourceComponentId)
  if (hasSourcePorts) return false
  if (
    injectionDb.pcb_component.getWhere({
      source_component_id: sourceComponentId,
    })
  ) {
    return false
  }
  const schematicComponent = injectionDb.schematic_component.getWhere({
    source_component_id: sourceComponentId,
  })
  if (!schematicComponent) return false
  return injectionDb.schematic_port.list().some((schematicPort) => {
    if (
      schematicPort.schematic_component_id !==
      schematicComponent.schematic_component_id
    ) {
      return false
    }
    const sourcePort = schematicPort.source_port_id
      ? injectionDb.source_port.get(schematicPort.source_port_id)
      : null
    return sourcePort?.source_component_id !== sourceComponentId
  })
}
