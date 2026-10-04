import { pinAttributeMap } from "@tscircuit/props"
import {
  checkNoGroundPinDefined,
  checkNoPowerPinDefined,
} from "@tscircuit/checks"
import type { SourcePinAttributes, SourcePort } from "circuit-json"
import type { Port } from "lib/components/primitive-components/Port"
import type { Chip } from "./Chip"

const getPinAttributeIssues = (attributes: SourcePinAttributes): string[] => {
  const issues: string[] = []
  const hasElectricalRole =
    attributes.is_input ||
    attributes.is_output ||
    attributes.is_bidirectional ||
    attributes.is_passive ||
    attributes.is_gpio ||
    attributes.requires_power ||
    attributes.provides_power ||
    attributes.requires_ground ||
    attributes.provides_ground ||
    attributes.requires_voltage !== undefined ||
    attributes.provides_voltage !== undefined ||
    attributes.do_not_connect ||
    Object.entries(attributes).some(
      ([name, value]) =>
        (name.startsWith("supports_") ||
          name.startsWith("is_configured_for_")) &&
        value === true,
    )
  if (!hasElectricalRole) {
    issues.push("missing electrical role in pinAttributes")
  }
  if (attributes.do_not_connect && attributes.must_be_connected) {
    issues.push("doNotConnect conflicts with mustBeConnected")
  }
  if (attributes.requires_ground || attributes.provides_ground) {
    if (
      (attributes.requires_voltage !== undefined &&
        attributes.requires_voltage !== 0) ||
      (attributes.provides_voltage !== undefined &&
        attributes.provides_voltage !== 0)
    ) {
      issues.push("ground pin declares a nonzero voltage")
    }
  }

  // An omitted capability is unknown, not explicitly unsupported.
  const operatingModes = [
    [
      "is_using_tri_state",
      "can_use_tri_state",
      "isUsingTriState",
      "canUseTriState",
    ],
    [
      "is_using_open_collector",
      "can_use_open_collector",
      "isUsingOpenCollector",
      "canUseOpenCollector",
    ],
    [
      "is_using_open_emitter",
      "can_use_open_emitter",
      "isUsingOpenEmitter",
      "canUseOpenEmitter",
    ],
    [
      "is_using_open_drain",
      "can_use_open_drain",
      "isUsingOpenDrain",
      "canUseOpenDrain",
    ],
    [
      "is_using_push_pull",
      "can_use_push_pull",
      "isUsingPushPull",
      "canUsePushPull",
    ],
    [
      "is_using_internal_pullup",
      "can_use_internal_pullup",
      "isUsingInternalPullup",
      "canUseInternalPullup",
    ],
    [
      "is_using_internal_pulldown",
      "can_use_internal_pulldown",
      "isUsingInternalPulldown",
      "canUseInternalPulldown",
    ],
  ] as const
  for (const [using, supported, usingProp, supportedProp] of operatingModes) {
    if (attributes[using] && attributes[supported] === false) {
      issues.push(`${usingProp} conflicts with ${supportedProp}: false`)
    }
  }
  return issues
}

/** Validate resolved electrical metadata without modifying user or imported attributes. */
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
    const [warning] = checksDisabled ? [] : check(chipCircuitJson)
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
  const issues: {
    pinName: string
    reasons: string[]
    sourcePort?: SourcePort
  }[] = []
  if (!checksDisabled) {
    for (const sourcePort of sourcePorts) {
      const reasons = getPinAttributeIssues(sourcePort)
      const aliases = new Set([
        sourcePort.name,
        ...(sourcePort.port_hints ?? []),
      ])
      for (const alias of aliases) {
        const attributes = chip.props.pinAttributes?.[alias]
        if (!attributes) continue
        const unknownAttributes = Object.keys(attributes).filter(
          (attributeName) => !(attributeName in pinAttributeMap.shape),
        )
        if (unknownAttributes.length) {
          reasons.push(
            `unknown pinAttributes fields: ${unknownAttributes.join(", ")}`,
          )
        }
      }
      if (reasons.length) {
        const pinName =
          sourcePort.name ||
          (sourcePort.pin_number !== undefined
            ? `pin${sourcePort.pin_number}`
            : "unnamed pin")
        issues.push({ pinName, reasons, sourcePort })
      }
    }
    for (const pinName of Object.keys(chip.props.pinAttributes ?? {})) {
      if (
        !sourcePorts.some((port) =>
          [port.name, ...(port.port_hints ?? [])].includes(pinName),
        )
      ) {
        issues.push({ pinName, reasons: ["does not match a chip pin"] })
      }
    }
  }

  if (!issues.length) {
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
    source_port_ids: issues.flatMap(({ sourcePort }) =>
      sourcePort ? [sourcePort.source_port_id] : [],
    ),
    subcircuit_id: chip.getSubcircuit().subcircuit_id ?? undefined,
    warning_type: "source_component_pins_underspecified_warning" as const,
    message: `Chip ${chip.name || "unnamed chip"} has pinAttributes issues affecting ${issues.length} pin${issues.length === 1 ? "" : "s"}: ${examples}${remaining}. Specify an electrical role for each pin and correct inconsistent attributes.`,
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
