import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { symbols } from "schematic-symbols"
import type { SchematicSymbol } from "./SchematicSymbol"

export const SchematicSymbol_doInitialSchematicComponentRender = (
  schematicSymbol: SchematicSymbol,
): void => {
  if (schematicSymbol.root?.schematicDisabled) return
  if (schematicSymbol.getCollapsedSchematicBoxAncestor()) return

  const { db } = schematicSymbol.root!
  const symbolName = schematicSymbol._getSchematicSymbolNameOrThrow()
  const symbol = symbols[symbolName]
  if (!symbol) {
    throw new Error(`No schematic symbol found for "${symbolName}"`)
  }

  const center = schematicSymbol._getGlobalSchematicPositionBeforeLayout()
  const schematicSheetId = schematicSymbol._resolveSchematicSheetId()
  const subcircuitId =
    schematicSymbol.getSubcircuit().subcircuit_id ?? undefined
  const schematicComponent = db.schematic_component.insert({
    center,
    size: { ...symbol.size },
    is_box_with_pins: true,
    symbol_name: symbolName,
    source_component_id: schematicSymbol.source_component_id ?? undefined,
    schematic_sheet_id: schematicSheetId,
  })

  schematicSymbol.schematic_component_id =
    schematicComponent.schematic_component_id

  for (const symbolPort of symbol.ports) {
    const port = schematicSymbol.getPortForSymbolPort(symbolPort)
    if (!port?.source_port_id) {
      throw new Error(
        `Missing source port for schematic symbol port "${symbolPort.labels.join("/")}" on ${schematicSymbol.getString()}`,
      )
    }
    const portCenter = {
      x: center.x + symbolPort.x - symbol.center.x,
      y: center.y + symbolPort.y - symbol.center.y,
    }

    const schematicPort = db.schematic_port.insert({
      schematic_component_id: schematicComponent.schematic_component_id,
      center: portCenter,
      source_port_id: port.source_port_id,
      facing_direction: getRelativeDirection(
        center,
        portCenter,
      ) as SchematicPort["facing_direction"],
      distance_from_component_edge: 0.4,
      pin_number: port._parsedProps.pinNumber,
      display_pin_label: port._parsedProps.aliases?.[0],
      is_connected: false,
      schematic_sheet_id: schematicSheetId,
      subcircuit_id: subcircuitId,
    })
    port.schematic_port_id = schematicPort.schematic_port_id
  }
}
