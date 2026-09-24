import { analyzeSchematicPlacement } from "@tscircuit/circuit-json-schematic-placement-analysis/analysis"
import { cju } from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  SchematicComponentStylingWarning,
} from "circuit-json"

// Enable reviewed placement findings individually as core schematic warnings.
const enabledIssueTypes = ["TwoPinComponentHasInvertedRails"] as const

export function getSchematicPlacementWarnings(
  circuitJson: AnyCircuitElement[],
): SchematicComponentStylingWarning[] {
  const analysis = analyzeSchematicPlacement(circuitJson, {
    issueTypes: enabledIssueTypes,
  })
  const db = cju(circuitJson)
  return analysis
    .getIssues()
    .flatMap((issue): SchematicComponentStylingWarning[] => {
      if (issue.lineItemType !== "TwoPinComponentHasInvertedRails") return []
      const schematicComponentId = issue.schematicBox.schematicComponentId
      if (!schematicComponentId) return []
      const component = db.schematic_component.get(schematicComponentId)
      if (!component) return []
      const group = component.schematic_group_id
        ? db.schematic_group.get(component.schematic_group_id)
        : undefined
      const componentName =
        issue.schematicBox.sourceComponentName ?? schematicComponentId
      return [
        {
          type: "schematic_component_styling_warning",
          schematic_component_styling_warning_id: `schematic_component_styling_warning_${schematicComponentId}_inverted_rails`,
          warning_type: "schematic_component_styling_warning",
          styling_issue_type: "inverted_rails",
          message: `${componentName} has its positive-supply connection below its ground connection. Rotate ${componentName} by 180°, preserving pin connections, and reroute attached traces.`,
          schematic_component_id: schematicComponentId,
          source_component_id: component.source_component_id,
          schematic_sheet_id: component.schematic_sheet_id,
          subcircuit_id: component.subcircuit_id ?? group?.subcircuit_id,
          schematic_port_ids: db.schematic_port
            .list()
            .filter(
              (port) => port.schematic_component_id === schematicComponentId,
            )
            .map((port) => port.schematic_port_id),
        },
      ]
    })
}
