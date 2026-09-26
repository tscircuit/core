import type { SchematicComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"

export function getInflatedSchematicComponent(
  sourceComponentId: string,
  inflatorContext: InflatorContext,
): SchematicComponent | null {
  const { injectionDb } = inflatorContext
  const directSchematicComponent = injectionDb.schematic_component.getWhere({
    source_component_id: sourceComponentId,
  }) as SchematicComponent | null
  if (directSchematicComponent) return directSchematicComponent

  const sourcePortIds = new Set(
    injectionDb.source_port
      .list()
      .filter(
        (sourcePort) => sourcePort.source_component_id === sourceComponentId,
      )
      .map((sourcePort) => sourcePort.source_port_id),
  )
  const relatedSchematicPort = injectionDb.schematic_port
    .list()
    .find((schematicPort) =>
      sourcePortIds.has(schematicPort.source_port_id ?? ""),
    )
  if (!relatedSchematicPort?.schematic_component_id) return null
  return injectionDb.schematic_component.get(
    relatedSchematicPort.schematic_component_id,
  ) as SchematicComponent | null
}

export function getInflatedSchematicProps(
  schematicComponent: SchematicComponent | null,
  inflatorContext: InflatorContext,
): {
  schX?: number
  schY?: number
  schRotation?: number
  schSheetName?: string
  symbolName?: string
} {
  if (!schematicComponent) return {}
  const schematicSheet = schematicComponent.schematic_sheet_id
    ? inflatorContext.injectionDb.schematic_sheet.get(
        schematicComponent.schematic_sheet_id,
      )
    : null
  const schematicRotation = (
    schematicComponent as SchematicComponent & { rotation?: number }
  ).rotation
  return {
    schX: schematicComponent.center.x,
    schY: schematicComponent.center.y,
    schRotation: schematicRotation,
    schSheetName: schematicSheet?.name,
    symbolName: schematicComponent.symbol_name,
  }
}
