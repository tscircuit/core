import type { AnyCircuitElement } from "circuit-json"

export function getSchematicDiagnostics(circuitJson: AnyCircuitElement[]) {
  const errors: string[] = []
  const warnings: string[] = []

  for (const element of circuitJson) {
    const { type } = element
    if (!type.startsWith("schematic_") && !type.startsWith("source_")) continue

    const diagnosticList = type.endsWith("_error")
      ? errors
      : type.endsWith("_warning")
        ? warnings
        : undefined
    if (!diagnosticList) continue

    // Trace instance numbers depend on which other tests have rendered first.
    const message =
      "message" in element
        ? element.message?.replace(/<trace#\d+\(/g, "<trace(")
        : undefined
    diagnosticList.push(message ? `${type}: ${message}` : type)
  }

  return { errors: errors.sort(), warnings: warnings.sort() }
}
