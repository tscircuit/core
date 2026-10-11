import type { PinAttributeMap } from "@tscircuit/props"
import type { SourcePinAttributes } from "circuit-json"
import { applyPinAttributesToSourcePort } from "./apply-pin-attributes-to-source-port"

/** Compare explicit declarations with known imported facts, before overrides merge. */
export const getPinAttributeMismatches = (
  declared: PinAttributeMap,
  imported: SourcePinAttributes,
): string[] => {
  const mismatches: string[] = []
  for (const propName of Object.keys(declared) as (keyof PinAttributeMap)[]) {
    if (propName === "highlightColor" || propName === "includeInBoardPinout")
      continue
    const normalized: SourcePinAttributes = {}
    applyPinAttributesToSourcePort(normalized, {
      [propName]: declared[propName],
    })
    // An explicit capabilities list replaces imported capabilities, including
    // an empty list. Missing imported flags remain unknown.
    if (propName === "capabilities") {
      for (const attributeName of Object.keys(
        imported,
      ) as (keyof SourcePinAttributes)[]) {
        if (attributeName.startsWith("supports_"))
          Object.assign(normalized, {
            [attributeName]: normalized[attributeName] ?? false,
          })
      }
    }
    for (const attributeName of Object.keys(
      normalized,
    ) as (keyof SourcePinAttributes)[]) {
      const declaredValue = normalized[attributeName]
      // Runtime selections can differ from the imported default configuration.
      // Warn only when a selected mode is explicitly unsupported by the part.
      const supportedAttributeName = attributeName.startsWith(
        "is_configured_for_",
      )
        ? attributeName.replace("is_configured_for_", "supports_")
        : attributeName.startsWith("is_using_")
          ? attributeName.replace("is_using_", "can_use_")
          : undefined
      if (supportedAttributeName) {
        if (
          declaredValue === true &&
          imported[supportedAttributeName as keyof SourcePinAttributes] ===
            false
        )
          mismatches.push(
            `${propName}: ${JSON.stringify(declared[propName])}, fetched ${supportedAttributeName}: false`,
          )
        continue
      }
      const importedValue = imported[attributeName]
      // Equivalent voltage units can differ by floating-point rounding.
      const valuesMatch =
        typeof importedValue === "number" && typeof declaredValue === "number"
          ? Math.abs(importedValue - declaredValue) <=
            Number.EPSILON *
              8 *
              Math.max(1, Math.abs(importedValue), Math.abs(declaredValue))
          : importedValue === declaredValue
      if (
        importedValue !== undefined &&
        declaredValue !== undefined &&
        !valuesMatch
      )
        mismatches.push(
          `${propName}: ${JSON.stringify(declared[propName])}, fetched ${attributeName}: ${JSON.stringify(importedValue)}`,
        )
    }
  }
  return mismatches
}
