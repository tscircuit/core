import { schematic_manual_edit_conflict_warning } from "circuit-json"
import { insertSchematicBoxTooSmallWarnings } from "lib/utils/schematic/insert-schematic-box-too-small-warnings"
import { isValidElement as isReactElement } from "react"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_doInitialSchematicComponentRender(
  component: NormalComponent<any, any>,
): void {
  if (component.root?.schematicDisabled) return
  if (component.getCollapsedSchematicBoxAncestor()) return
  const { db } = component.root!

  // Insert warnings for invalid pin labels
  if (component._invalidPinLabelMessages?.length && component.root?.db) {
    for (const message of component._invalidPinLabelMessages) {
      let property_name = "pinLabels"
      const match = message.match(/^Invalid pin label:\s*([^=]+)=\s*'([^']+)'/)
      if (match) {
        const label = match[2]
        property_name = `pinLabels['${label}']`
      }
      component.root.db.source_property_ignored_warning.insert({
        source_component_id: component.source_component_id!,
        property_name,
        message,
        error_type: "source_property_ignored_warning",
      })
    }
  }

  // Warn when the deprecated schPinSpacing prop is passed
  if (
    component._parsedProps.schPinSpacing !== undefined &&
    component.root?.db
  ) {
    component.root.db.source_property_ignored_warning.insert({
      source_component_id: component.source_component_id!,
      property_name: "schPinSpacing",
      error_type: "source_property_ignored_warning",
      message:
        "schPinSpacing is deprecated and will be ignored. Pin spacing is always 0.2.",
    })
  }

  const { schematicSymbolName } = component.config
  const { _parsedProps: props } = component

  const hasSymbolChild = component.children.some(
    (c) => c.componentName === "Symbol",
  )

  // Check if there's a custom symbol JSX prop or an inflated symbol child
  if ((props.symbol && isReactElement(props.symbol)) || hasSymbolChild) {
    component._doInitialSchematicComponentRenderWithReactSymbol(props.symbol)
  } else if (schematicSymbolName) {
    component._doInitialSchematicComponentRenderWithSymbol()
  } else {
    const dimensions = component._getSchematicBoxDimensions()
    if (dimensions) {
      insertSchematicBoxTooSmallWarnings(component, dimensions)
      component._doInitialSchematicComponentRenderWithSchematicBoxDimensions()
    }
  }

  const manualPlacement = component
    .getSubcircuit()
    ?._getSchematicManualPlacementForComponent(component)

  if (
    component.schematic_component_id &&
    (component.props.schX !== undefined ||
      component.props.schY !== undefined) &&
    !!manualPlacement
  ) {
    if (!component.schematic_component_id) {
      return
    }

    const warning = schematic_manual_edit_conflict_warning.parse({
      type: "schematic_manual_edit_conflict_warning",
      schematic_manual_edit_conflict_warning_id: `schematic_manual_edit_conflict_${component.source_component_id}`,
      message: `${component.getString()} has both manual placement and prop coordinates. schX and schY will be used. Remove schX/schY or clear the manual placement.`,
      schematic_component_id: component.schematic_component_id!,
      source_component_id: component.source_component_id!,
      subcircuit_id: component.getSubcircuit()?.subcircuit_id,
    })

    db.schematic_manual_edit_conflict_warning.insert(warning)
  }

  // Warn when schSheetName does not resolve to any schematic sheet, so the user
  // gets feedback that their schSheetName was ignored. Resolution is delegated
  // to _resolveSchematicSheetId so this stays correct as sheet matching evolves.
  const schSheetName =
    component._parsedProps?.schSheetName ?? component.props.schSheetName
  if (
    schSheetName &&
    component.source_component_id &&
    !component._resolveSchematicSheetId()
  ) {
    db.source_property_ignored_warning.insert({
      source_component_id: component.source_component_id,
      property_name: "schSheetName",
      error_type: "source_property_ignored_warning",
      subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
      message: `${component.getString()} references schSheetName "${schSheetName}", which does not match any schematic sheet and will be ignored.`,
    })
  }

  // No schematic symbol or dimensions defined, this could be a board, group
  // or other NormalComponent that doesn't have a schematic representation
}
