import type { Port } from "../Port"
import { areAllPcbPrimitivesOverlapping } from "../Port/areAllPcbPrimitivesOverlapping"

export const Trace_getPcbSelectorError = (
  selector: string,
  port: Port,
): string | null => {
  if (port.pcb_port_id) return null

  const pcbMatches = port.matchedComponents.filter((c) => c.isPcbPrimitive)
  const parentName =
    port.getParentNormalComponent()?.props.name ??
    port.parent?.props.name ??
    "unknown"
  const rawPinSelectors = Array.from(
    new Set(
      port
        .getNameAndAliases()
        .filter((alias) => /^pin\d+$/.test(alias))
        .map((alias) => `${parentName}.${alias}`),
    ),
  )

  if (pcbMatches.length > 1 && !areAllPcbPrimitivesOverlapping(pcbMatches)) {
    const suggestion =
      rawPinSelectors.length > 0
        ? ` Use a raw pin selector like ${rawPinSelectors.map((s) => `"${s}"`).join(" or ")}.`
        : ""

    return `Trace selector "${selector}" resolved to "${parentName}.${port.props.name}", but that target maps to multiple non-overlapping PCB pads: ${pcbMatches.map((c) => c.getString()).join(", ")}.${suggestion}`
  }

  return null
}
