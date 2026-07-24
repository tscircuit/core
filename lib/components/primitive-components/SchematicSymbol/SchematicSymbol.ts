import { schematicSymbolProps } from "@tscircuit/props"
import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { getRotatedSymbolName } from "lib/utils/schematic/getRotatedSymbolName"
import { symbols } from "schematic-symbols"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"

const getDisplayPinLabel = (labels: string[]): string | undefined =>
  labels.find((label) => !/^(pin)?\d+$/.test(label))

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  override _getSchematicSymbolName(): keyof typeof symbols | undefined {
    const { symbolName, schRotation } = this._parsedProps
    const normalizedRotation = (((schRotation ?? 0) % 360) + 360) % 360

    if (schRotation !== undefined && normalizedRotation % 90 !== 0) {
      throw new Error(
        `Schematic rotation ${schRotation} is not supported for ${this.componentName}`,
      )
    }

    if (symbolName in symbols) {
      const rotatedSymbolName = getRotatedSymbolName(
        symbolName,
        normalizedRotation,
      )
      if (rotatedSymbolName && rotatedSymbolName in symbols) {
        return rotatedSymbolName as keyof typeof symbols
      }
      return symbolName as keyof typeof symbols
    }

    return super._getSchematicSymbolName()
  }

  doInitialSchematicComponentRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    const { db } = this.root!
    const symbolName = this._getSchematicSymbolNameOrThrow()
    const symbol = symbols[symbolName]
    if (!symbol) {
      throw new Error(`No schematic symbol found for "${symbolName}"`)
    }
    const center = this._getGlobalSchematicPositionBeforeLayout()

    const schematicComponent = db.schematic_component.insert({
      center,
      size: { ...symbol.size },
      is_box_with_pins: true,
      symbol_name: symbolName,
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })
    this.schematic_component_id = schematicComponent.schematic_component_id

    /*
     * This first implementation intentionally treats <schematicsymbol> as a
     * standalone schematic element. chipRef/connections mapping will be
     * implemented separately. displayName rendering is also deferred until
     * its Circuit JSON representation is defined.
     */
  }

  doInitialSchematicPortRender(): void {
    if (this.root?.schematicDisabled || !this.schematic_component_id) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    const { db } = this.root!
    const symbol = this.getSchematicSymbol()
    if (!symbol) return

    const center = this._getGlobalSchematicPositionBeforeLayout()
    const schematicSheetId = this._resolveSchematicSheetId()
    const subcircuitId = this.getSubcircuit().subcircuit_id ?? undefined

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
        schematic_component_id: this.schematic_component_id,
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
}
