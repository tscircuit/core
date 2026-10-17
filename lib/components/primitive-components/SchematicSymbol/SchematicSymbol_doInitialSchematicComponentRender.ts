import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { getRotatedSize } from "lib/utils/schematic/getRotatedSymbolName"
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

  const rawSymbolName =
    schematicSymbol.props.symbolName ??
    (schematicSymbol._parsedProps as any)?.symbolName
  const schRotation = schematicSymbol._parsedProps.schRotation ?? 0
  const normalizedRotation = ((Math.round(schRotation) % 360) + 360) % 360
  const effectiveRotation =
    symbolName === rawSymbolName ? normalizedRotation : 0

  const center = schematicSymbol._getGlobalSchematicPositionBeforeLayout()
  const schematicSheetId = schematicSymbol._resolveSchematicSheetId()
  const subcircuitId =
    schematicSymbol.getSubcircuit().subcircuit_id ?? undefined
  const schematicComponent = db.schematic_component.insert({
    center,
    size: getRotatedSize(symbol.size, effectiveRotation),
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

    const dx = symbolPort.x - symbol.center.x
    const dy = symbolPort.y - symbol.center.y

    let rx = dx
    let ry = dy
    if (effectiveRotation === 90) {
      rx = -dy
      ry = dx
    } else if (effectiveRotation === 180) {
      rx = -dx
      ry = -dy
    } else if (effectiveRotation === 270) {
      rx = dy
      ry = -dx
    } else if (effectiveRotation !== 0) {
      const rad = (effectiveRotation * Math.PI) / 180
      rx = dx * Math.cos(rad) - dy * Math.sin(rad)
      ry = dx * Math.sin(rad) + dy * Math.cos(rad)
    }

    const portCenter = {
      x: center.x + rx,
      y: center.y + ry,
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
