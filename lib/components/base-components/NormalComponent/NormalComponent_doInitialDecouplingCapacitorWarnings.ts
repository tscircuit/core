import { getChipSourcePortsMissingDecouplingCapacitor } from "lib/utils/source/get-chip-source-ports-missing-decoupling-capacitor"
import type { NormalComponent } from "./NormalComponent"

const getSourcePortDisplayLabel = (sourcePort: {
  name: string
  port_hints?: string[]
}): string =>
  sourcePort.port_hints?.find((sourcePortHint) =>
    /[A-Za-z]/.test(sourcePortHint),
  ) ?? sourcePort.name

export const NormalComponent_doInitialDecouplingCapacitorWarnings = (
  component: NormalComponent,
): void => {
  if (component.config.componentName !== "Chip") return
  if (!component.source_component_id || !component.root) return

  const sourcePortsMissingDecouplingCapacitor =
    getChipSourcePortsMissingDecouplingCapacitor(
      component.root.db,
      component.source_component_id,
    )

  for (const sourcePort of sourcePortsMissingDecouplingCapacitor) {
    const recommendedCapacitance =
      sourcePort.recommended_decoupling_capacitor_capacitance
    const capacitanceDescription =
      recommendedCapacitance === undefined ? "" : ` ${recommendedCapacitance}`

    component.root.db.source_pin_missing_trace_warning.insert({
      message: `Power pin ${getSourcePortDisplayLabel(sourcePort)} on ${component.props.name} should have a${capacitanceDescription} decoupling capacitor connected to ground`,
      source_component_id: component.source_component_id,
      source_port_id: sourcePort.source_port_id,
      subcircuit_id: component.getSubcircuit().subcircuit_id ?? undefined,
      warning_type: "source_pin_missing_trace_warning",
    })
  }
}
