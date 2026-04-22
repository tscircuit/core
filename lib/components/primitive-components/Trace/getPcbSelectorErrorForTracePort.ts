import type { Port } from "../Port"
import { areAllPcbPrimitivesOverlapping } from "../Port/areAllPcbPrimitivesOverlapping"
import type { PrimitiveComponent } from "../../base-components/PrimitiveComponent"

function formatPcbPrimitiveForError(component: PrimitiveComponent): string {
  const portHints = (component._parsedProps?.portHints ?? []) as string[]
  const aliases = portHints.filter(Boolean)
  if (aliases.length > 0) {
    return `<${component.lowercaseComponentName}(${aliases.map((alias) => `.${alias}`).join(", ")}) />`
  }
  return `<${component.lowercaseComponentName} />`
}

export function getPcbSelectorErrorForTracePort(
  selector: string,
  port: Port,
): string | null {
  const pcbMatches = port.matchedComponents.filter((c) => c.isPcbPrimitive)
  const parentName =
    port.getParentNormalComponent()?.props.name ??
    port.parent?.props.name ??
    "unknown"
  const parentNormalComponent = port.getParentNormalComponent()
  const selectorToken = selector
    .trim()
    .split(/\s+|>/)
    .filter(Boolean)
    .at(-1)
    ?.replace(/^port\./, "")
    .replace(/^\./, "")

  if (selectorToken && !/^(pin)?\d+$/.test(selectorToken)) {
    const siblingPorts: Port[] = (
      (parentNormalComponent?.children ?? []) as PrimitiveComponent[]
    ).filter(
      (child): child is Port =>
        child.componentName === "Port" &&
        (child as Port).isMatchingAnyOf([selectorToken]),
    )
    const internallyConnectedGroups =
      (parentNormalComponent?._getInternallyConnectedPins?.() ?? []) as Port[][]
    const matchingPortsAreInternallyConnected = internallyConnectedGroups.some(
      (group: Port[]) =>
        siblingPorts.every((siblingPort: Port) => group.includes(siblingPort)),
    )

    if (siblingPorts.length > 1 && !matchingPortsAreInternallyConnected) {
      const rawPinSelectors = Array.from(
        new Set(
          siblingPorts.flatMap((siblingPort) =>
            siblingPort
              .getNameAndAliases()
              .filter((alias) => /^pin\d+$/.test(alias))
              .map((alias) => `${parentName}.${alias}`),
          ),
        ),
      )
      const suggestion =
        rawPinSelectors.length > 0
          ? ` Use a raw pin selector like ${rawPinSelectors.map((s) => `"${s}"`).join(" or ")}.`
          : ""
      const siblingPcbMatches: PrimitiveComponent[] = siblingPorts.flatMap(
        (siblingPort: Port) =>
          siblingPort.matchedComponents.filter(
            (component: PrimitiveComponent) => component.isPcbPrimitive,
          ),
      )

      return `Trace selector "${selector}" resolved to "${parentName}.${port.props.name}", but alias "${selectorToken}" matches multiple PCB pads: ${siblingPcbMatches.map((component: PrimitiveComponent) => formatPcbPrimitiveForError(component)).join(", ")}.${suggestion}`
    }
  }

  if (port.pcb_port_id) return null

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

    return `Trace selector "${selector}" resolved to "${parentName}.${port.props.name}", but that target maps to multiple non-overlapping PCB pads: ${pcbMatches.map((c) => formatPcbPrimitiveForError(c)).join(", ")}.${suggestion}`
  }

  return null
}
