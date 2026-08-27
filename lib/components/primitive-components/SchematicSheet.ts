import { schematicSheetProps } from "@tscircuit/props"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { resolveCircuitJsonSchematicSheetProperties } from "lib/utils/schematic/get-circuit-json-schematic-sheet-size"
import { insertSchematicElementOutsideSheetWarnings } from "lib/utils/schematic/insertSchematicElementOutsideSheetWarnings"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicSheet extends PrimitiveComponent<
  typeof schematicSheetProps
> {
  isSchematicPrimitive = true
  resolvedSchematicSheetDisplayName = "Schematic Sheet"

  get config() {
    return {
      componentName: "SchematicSheet",
      zodProps: schematicSheetProps,
    }
  }

  doInitialSourceGroupRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const explicitlyReservedSheetIndices = new Set(
      this.root!.children.flatMap((component) => [
        component,
        ...component.getDescendants(),
      ])
        .filter((component) => component.componentName === "SchematicSheet")
        .map((component) => component._parsedProps.sheetIndex)
        .filter((sheetIndex): sheetIndex is number => sheetIndex !== undefined),
    )
    const occupiedSheetIndices = new Set([
      ...explicitlyReservedSheetIndices,
      ...db.schematic_sheet
        .list()
        .map((schematicSheet) => schematicSheet.sheet_index)
        .filter((sheetIndex): sheetIndex is number => sheetIndex !== undefined),
    ])
    let nextAvailableSheetIndex = 0
    while (occupiedSheetIndices.has(nextAvailableSheetIndex)) {
      nextAvailableSheetIndex += 1
    }
    const sheetIndex = props.sheetIndex ?? nextAvailableSheetIndex
    const name = props.name ?? props.displayName ?? `Sheet ${sheetIndex + 1}`
    const displayName = props.displayName ?? name
    this.resolvedSchematicSheetDisplayName = displayName
    const resolvedSheetProperties =
      resolveCircuitJsonSchematicSheetProperties(props)

    const schematicSheet = db.schematic_sheet.insert({
      name,
      display_name: displayName,
      sheet_index: sheetIndex,
      sheet_size: resolvedSheetProperties.sheetSize,
      sheet_width: resolvedSheetProperties.sheetWidth,
      sheet_height: resolvedSheetProperties.sheetHeight,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    } as any)

    this.schematic_sheet_id = schematicSheet.schematic_sheet_id
  }

  doInitialSchematicSheetRender(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_sheet_id) return

    const { db } = this.root!
    const resolvedSheetProperties = resolveCircuitJsonSchematicSheetProperties(
      this._parsedProps,
    )
    const schematicElements = [
      ...db.schematic_component.list(),
      ...db.schematic_port.list(),
      ...db.schematic_text.list(),
      ...db.schematic_line.list(),
      ...db.schematic_rect.list(),
      ...db.schematic_circle.list(),
      ...db.schematic_arc.list(),
      ...db.schematic_path.list(),
    ].filter(
      (element) =>
        (element as any).schematic_sheet_id === this.schematic_sheet_id,
    )

    let schematicSheetCenter = { x: 0, y: 0 }
    if (schematicElements.length > 0) {
      const bounds = getBoundsForSchematic(schematicElements)
      if (
        Number.isFinite(bounds.minX) &&
        Number.isFinite(bounds.maxX) &&
        Number.isFinite(bounds.minY) &&
        Number.isFinite(bounds.maxY)
      ) {
        schematicSheetCenter = {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        }

        db.schematic_sheet.update(this.schematic_sheet_id, {
          center: schematicSheetCenter,
        } as any)
      }
    }

    insertSchematicElementOutsideSheetWarnings({
      db,
      schematicSheetId: this.schematic_sheet_id,
      schematicSheetName: this.resolvedSchematicSheetDisplayName,
      schematicSheetCenter,
      sheetWidth: resolvedSheetProperties.sheetWidth,
      sheetHeight: resolvedSheetProperties.sheetHeight,
    })
  }
}
