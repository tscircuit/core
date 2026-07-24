declare const portIdType: unique symbol

type PortId<Type extends "schematic_port" | "source_port"> = string & {
  readonly [portIdType]: Type
}

export type SchematicPortId = PortId<"schematic_port">
export type SourcePortId = PortId<"source_port">

export const asSchematicPortId = (id: string): SchematicPortId =>
  id as SchematicPortId

export const asSourcePortId = (id: string): SourcePortId => id as SourcePortId
