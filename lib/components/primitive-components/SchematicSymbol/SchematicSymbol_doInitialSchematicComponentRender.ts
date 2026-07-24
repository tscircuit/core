import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { symbols } from "schematic-symbols"
import type { SchematicSymbol } from "./SchematicSymbol"

const getDisplayPinLabel = (labels: string[]): string | undefined =>
  labels.find((label) => !/^(pin)?\d+$/.test(label))

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
    schematic_sheet_id: schematicSheetId,
  })

  schematicSymbol.schematic_component_id =
    schematicComponent.schematic_component_id

  for (const symbolPort of symbol.ports) {
    const pinNumber = getPinNumberFromLabels(symbolPort.labels)
    const portName =
      getDisplayPinLabel(symbolPort.labels) ??
      (pinNumber ? `pin${pinNumber}` : symbolPort.labels[0])
    if (!portName) continue

    const sourcePort = db.source_port.insert({
      name: portName,
      pin_number: pinNumber ? Number(pinNumber) : undefined,
      port_hints: [...symbolPort.labels],
      subcircuit_id: subcircuitId,
    })
    const portCenter = {
      x: center.x + symbolPort.x - symbol.center.x,
      y: center.y + symbolPort.y - symbol.center.y,
    }

    db.schematic_port.insert({
      schematic_component_id: schematicComponent.schematic_component_id,
      center: portCenter,
      source_port_id: sourcePort.source_port_id,
      facing_direction: getRelativeDirection(
        center,
        portCenter,
      ) as SchematicPort["facing_direction"],
      distance_from_component_edge: 0.4,
      pin_number: pinNumber ? Number(pinNumber) : undefined,
      display_pin_label: getDisplayPinLabel(symbolPort.labels),
      is_connected: false,
      schematic_sheet_id: schematicSheetId,
      subcircuit_id: subcircuitId,
    })
  }
}
