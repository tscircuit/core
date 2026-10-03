import {
  source_pin_attributes,
  type SourcePinAttributes,
  type SourcePort,
} from "circuit-json"
import type { Port } from "./Port"
import { applyPinAttributesToSourcePort } from "./apply-pin-attributes-to-source-port"

const getImportedSourcePinAttributes = (
  port: Port,
  importedSourcePorts: SourcePort[],
): SourcePinAttributes => {
  // A footprint can contain several components. Do not guess which owns a pin.
  if (
    new Set(
      importedSourcePorts.map((sourcePort) => sourcePort.source_component_id),
    ).size > 1
  )
    return {}
  const pinNumber = port.props.pinNumber
  const physicalMatches =
    pinNumber === undefined
      ? []
      : importedSourcePorts.filter(
          (sourcePort) => sourcePort.pin_number === pinNumber,
        )
  const aliases = port.getNameAndAliases()
  const matches =
    physicalMatches.length > 0
      ? physicalMatches
      : importedSourcePorts.filter((sourcePort) =>
          [sourcePort.name, ...(sourcePort.port_hints ?? [])].some((alias) =>
            aliases.includes(alias),
          ),
        )
  if (matches.length !== 1) return {}
  // Select canonical electrical fields without copying imported IDs or labels.
  const attributes = source_pin_attributes.parse(matches[0])
  for (const attributeName of Object.keys(
    attributes,
  ) as (keyof SourcePinAttributes)[]) {
    if (attributes[attributeName] === undefined)
      delete attributes[attributeName]
  }
  return attributes
}

/** Imported attributes supply defaults; explicit user pin attributes take precedence. */
export const resolvePortSourcePinAttributes = (
  port: Port,
): SourcePinAttributes => {
  const attributes = getImportedSourcePinAttributes(
    port,
    port.getParentNormalComponent()?._importedSourcePorts ?? [],
  )
  for (const pinAttributes of port._getMatchingPinAttributes()) {
    for (const attributeName of Object.keys(
      attributes,
    ) as (keyof SourcePinAttributes)[]) {
      if (
        (pinAttributes.capabilities !== undefined &&
          attributeName.startsWith("supports_")) ||
        ((pinAttributes.activeCapability !== undefined ||
          pinAttributes.activeCapabilities !== undefined) &&
          attributeName.startsWith("is_configured_for_"))
      )
        delete attributes[attributeName]
    }
    applyPinAttributesToSourcePort(attributes, pinAttributes)
  }
  return attributes
}
