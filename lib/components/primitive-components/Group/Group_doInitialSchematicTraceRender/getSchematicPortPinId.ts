import type { SchematicPort, SourcePort } from "circuit-json"

export const getSchematicPortPinId = ({
  componentName,
  schematicPort,
  sourcePort,
}: {
  componentName: string
  schematicPort: SchematicPort
  sourcePort?: SourcePort
}) => {
  const pinIdentifier =
    schematicPort.pin_number ?? sourcePort?.name ?? sourcePort?.port_hints?.[0]

  return `${componentName}.${pinIdentifier ?? schematicPort.schematic_port_id}`
}
