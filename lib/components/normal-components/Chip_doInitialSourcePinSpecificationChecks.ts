import {
  checkAllPinsInComponentAreUnderspecified,
  checkNoGroundPinDefined,
  checkNoPowerPinDefined,
} from "@tscircuit/checks"
import type { SourcePort } from "circuit-json"
import type { Port } from "lib/components/primitive-components/Port"
import { getPinAttributeMismatches } from "lib/components/primitive-components/Port/get-pin-attribute-mismatches"
import { getImportedSourcePinAttributes } from "lib/components/primitive-components/Port/resolve-port-source-pin-attributes"
import type { PinAttributeMap } from "@tscircuit/props"
import type { Chip } from "./Chip"
import { Chip_fetchPinAttributesForValidation } from "./Chip_fetchPinAttributesForValidation"

/** Compare explicit attributes with fetched pin metadata in this chip's source lifecycle. */
export const Chip_doInitialSourcePinSpecificationChecks = (
  chip: Chip<string>,
) => {
  if (chip.config.componentName !== "Chip") return
  if (!chip.source_component_id) return
  const { db } = chip.root!
  const existingWarning =
    db.source_component_pins_underspecified_warning.getWhere({
      source_component_id: chip.source_component_id,
    })
  const drcChecksDisabled =
    chip.root?.platform?.drcChecksDisabled ??
    chip.getInheritedProperty("drcChecksDisabled")
  const pinSpecificationDrcChecksDisabled =
    chip.root?.platform?.pinSpecificationDrcChecksDisabled ??
    chip.getInheritedProperty("pinSpecificationDrcChecksDisabled")

  const checksDisabled = drcChecksDisabled || pinSpecificationDrcChecksDisabled
  if (!checksDisabled) Chip_fetchPinAttributesForValidation(chip)
  const sourcePorts = checksDisabled
    ? []
    : chip.selectAll<Port>("port").flatMap((port) => {
        if (!port.source_port_id) return []
        const sourcePort = db.source_port.get(port.source_port_id)
        return sourcePort?.source_component_id === chip.source_component_id
          ? [sourcePort]
          : []
      })
  const sourceComponent = checksDisabled
    ? null
    : db.source_component.get(chip.source_component_id)
  const chipCircuitJson = sourceComponent
    ? [sourceComponent, ...sourcePorts]
    : []

  const issues: {
    pinName: string
    reasons: string[]
    sourcePort: SourcePort
  }[] = []
  if (!checksDisabled) {
    for (const port of chip.selectAll<Port>("port")) {
      const sourcePort = sourcePorts.find(
        (sourcePort) => sourcePort.source_port_id === port.source_port_id,
      )
      if (!sourcePort) continue
      const declared: PinAttributeMap = {}
      // Use the same alias precedence as source rendering, excluding synthetic
      // noConnect attributes: leaving a usable pin unconnected is intentional.
      for (const alias of port.getNameAndAliases()) {
        Object.assign(declared, chip._parsedProps.pinAttributes?.[alias])
      }
      const imported = getImportedSourcePinAttributes(
        port,
        chip._fetchedSourcePortsForPinAttributes.length
          ? chip._fetchedSourcePortsForPinAttributes
          : chip._importedSourcePorts,
      )
      const reasons = getPinAttributeMismatches(declared, imported)
      if (reasons.length)
        issues.push({
          pinName: sourcePort.name || "unnamed pin",
          reasons,
          sourcePort,
        })
    }
  }
  // Reuse existing power/ground rules on this chip alone. Keep warning identities
  // stable on updates, and remove diagnostics when resolved or disabled.
  for (const [warningTable, check] of [
    [db.source_no_power_pin_defined_warning, checkNoPowerPinDefined],
    [db.source_no_ground_pin_defined_warning, checkNoGroundPinDefined],
  ] as const) {
    const existing = warningTable.getWhere({
      source_component_id: chip.source_component_id,
    })
    const existingId =
      existing?.type === "source_no_power_pin_defined_warning"
        ? existing.source_no_power_pin_defined_warning_id
        : existing?.source_no_ground_pin_defined_warning_id
    const [warning] =
      checksDisabled || issues.length ? [] : check(chipCircuitJson)
    if (warning) {
      if (existingId) {
        warningTable.update(existingId, {
          message: warning.message,
          source_port_ids: warning.source_port_ids,
          subcircuit_id: warning.subcircuit_id,
        })
      } else {
        db.insertAll([warning])
      }
    } else if (existingId) {
      warningTable.delete(existingId)
    }
  }
  // Keep the existing all-underspecified warning when no comparison conflicts
  // exist. Both use the existing aggregate chip-pin diagnostic table.
  const [underspecifiedWarning] = checksDisabled
    ? []
    : checkAllPinsInComponentAreUnderspecified(chipCircuitJson)

  if (!issues.length && !underspecifiedWarning) {
    if (existingWarning) {
      db.source_component_pins_underspecified_warning.delete(
        existingWarning.source_component_pins_underspecified_warning_id,
      )
    }
    return
  }

  const examples = issues
    .slice(0, 3)
    .map(({ pinName, reasons }) => `${pinName} (${reasons.join("; ")})`)
    .join(", ")
  const remaining = issues.length > 3 ? `, and ${issues.length - 3} more` : ""
  const warning = {
    source_component_id: chip.source_component_id,
    source_port_ids: issues.length
      ? issues.map(({ sourcePort }) => sourcePort.source_port_id)
      : underspecifiedWarning!.source_port_ids,
    subcircuit_id: chip.getSubcircuit().subcircuit_id ?? undefined,
    warning_type: "source_component_pins_underspecified_warning" as const,
    message: issues.length
      ? `Chip ${chip.name || "unnamed chip"} has pinAttributes that conflict with fetched pin metadata on ${issues.length} pin${issues.length === 1 ? "" : "s"}: ${examples}${remaining}. Check the chip configuration against the part datasheet.`
      : underspecifiedWarning!.message,
  }
  if (existingWarning) {
    db.source_component_pins_underspecified_warning.update(
      existingWarning.source_component_pins_underspecified_warning_id,
      warning,
    )
  } else {
    db.source_component_pins_underspecified_warning.insert(warning)
  }
}
