import type { Port } from "./Port"

/** A shared signal label is not a unique physical package pin. */
export function assertUnambiguousPhysicalPortSelection(
  ports: Port[],
  selector: string,
): void {
  if (ports.length < 2 || !ports.some((port) => port.physicalPinName)) return
  const names = ports.map((port) => {
    const componentName =
      port.getParentNormalComponent()?.name ?? "unnamed component"
    return `${componentName}.${port.physicalPinName ?? port.name}`
  })
  throw new Error(
    `Ambiguous port "${selector}"; use a physical ball name: ${names.join(", ")}.`,
  )
}
