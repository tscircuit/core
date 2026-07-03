import { Port } from "lib/components/primitive-components/Port"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_doInitialResolveFootprintPinLabels(
  component: NormalComponent<any, any>,
) {
  const pinLabels: Record<string, string[]> = {}
  for (const port of component.getPortsFromFootprint()) {
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const genericPinLabels = new Set([`pin${pinNumber}`, `${pinNumber}`])
    const labels = port
      .getNameAndAliases()
      .filter((label) => !genericPinLabels.has(label))
    if (labels.length > 0) {
      pinLabels[`pin${pinNumber}`] = labels
    }
  }

  component._impliedFootprintPinLabels = {
    ...(component._impliedFootprintPinLabels ?? {}),
    ...pinLabels,
  }
  if (Object.keys(component._impliedFootprintPinLabels).length === 0) return

  for (const child of [...component.children]) {
    if (child.componentName !== "Port") continue
    const port = child as Port
    if (port.originDescription) {
      component.remove(port)
    }
  }
}
