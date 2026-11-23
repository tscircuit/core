import { schematicSheetProps } from "@tscircuit/props"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { resolveCircuitJsonSchematicSheetProperties } from "lib/utils/schematic/get-circuit-json-schematic-sheet-size"
import { warnIfSchematicElementsOutsideSheet } from "lib/utils/schematic/warn-if-schematic-elements-outside-sheet"
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

  doInitialSourceRender(): void {
    if (this.root?.schematicDisabled) return
    const { db, schematicLayout } = this.root!
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
      ...schematicLayout.sheet
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

    const sheet = {
      type: "schematic_sheet" as const,
      name,
      display_name: displayName,
      sheet_index: sheetIndex,
      sheet_size: resolvedSheetProperties.sheetSize,
      sheet_width: resolvedSheetProperties.sheetWidth,
      sheet_height: resolvedSheetProperties.sheetHeight,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    }
    this.schematic_sheet_id =
      this._insertSchematicGeometry(sheet).schematic_sheet_id

    const defaultSheetProperties = resolveCircuitJsonSchematicSheetProperties({
      sheetSize: "A4",
    })
    if (
      resolvedSheetProperties.sheetSize !== defaultSheetProperties.sheetSize ||
      resolvedSheetProperties.sheetWidth !==
        defaultSheetProperties.sheetWidth ||
      resolvedSheetProperties.sheetHeight !== defaultSheetProperties.sheetHeight
    ) {
      db.schematic_sheet_styling_warning.insert({
        warning_type: "schematic_sheet_styling_warning",
        styling_issue_type: "non_default_sheet_size",
        schematic_sheet_id: this.schematic_sheet_id,
        subcircuit_id: sheet.subcircuit_id,
        message: `Schematic sheet "${displayName}" uses a non-default size (${resolvedSheetProperties.sheetWidth} × ${resolvedSheetProperties.sheetHeight} mm). Prefer the default A4 sheet size (297 × 210 mm) for consistent schematic styling.`,
      })
    }
  }

  doInitialSchematicSheetRender(): void {
    if (this.root?.schematicDisabled) return
    if (!this.schematic_sheet_id) return

    const { db, schematicLayout } = this.root!
    const resolvedSheetProperties = resolveCircuitJsonSchematicSheetProperties(
      this._parsedProps,
    )
    const hasExplicitSheetDimensions =
      this._parsedProps.sheetWidth !== undefined ||
      this._parsedProps.sheetHeight !== undefined

    if (hasExplicitSheetDimensions) {
      warnIfSchematicElementsOutsideSheet({
        db,
        schematicSheetId: this.schematic_sheet_id,
        schematicSheetName: this.resolvedSchematicSheetDisplayName,
        schematicSheetCenter: { x: 0, y: 0 },
        sheetWidth: resolvedSheetProperties.sheetWidth,
        sheetHeight: resolvedSheetProperties.sheetHeight,
      })
      return
    }

    const schematicElements = [
      ...schematicLayout.component.list(),
      ...schematicLayout.port.list(),
      ...schematicLayout.text.list(),
      ...schematicLayout.line.list(),
      ...schematicLayout.rect.list(),
      ...schematicLayout.circle.list(),
      ...schematicLayout.arc.list(),
      ...schematicLayout.path.list(),
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

        schematicLayout.sheet.update(this.schematic_sheet_id, {
          center: schematicSheetCenter,
        } as any)
      }
    }

    warnIfSchematicElementsOutsideSheet({
      db,
      schematicSheetId: this.schematic_sheet_id,
      schematicSheetName: this.resolvedSchematicSheetDisplayName,
      schematicSheetCenter,
      sheetWidth: resolvedSheetProperties.sheetWidth,
      sheetHeight: resolvedSheetProperties.sheetHeight,
    })
  }
}
