import type { SchematicPort, SourcePort } from "circuit-json"

export const getSchematicPortSelector = ({
  schematicComponentSelectorPrefix,
  schematicPort,
  sourcePort,
}: {
  schematicComponentSelectorPrefix: string
  schematicPort: SchematicPort
  sourcePort?: SourcePort
}) => {
  const pinIdentifier =
    schematicPort.pin_number ?? sourcePort?.name ?? sourcePort?.port_hints?.[0]

  return `${schematicComponentSelectorPrefix}.${pinIdentifier ?? schematicPort.schematic_port_id}`
}
