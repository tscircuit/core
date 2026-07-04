import { Port } from "lib/components/primitive-components/Port"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_doInitialResolveFootprintPinLabels(
  component: NormalComponent<any, any>,
) {
  const pinLabelsBeforeFootprint = component._impliedFootprintPinLabels ?? {}
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
    ...pinLabels,
    ...pinLabelsBeforeFootprint,
  }
  if (Object.keys(component._impliedFootprintPinLabels).length === 0) return

  const propsPinLabels = component._parsedProps.pinLabels
  const pinLabelsFromProps =
    propsPinLabels && Array.isArray(propsPinLabels)
      ? Object.fromEntries(
          propsPinLabels.map((label, index) => [`pin${index + 1}`, label]),
        )
      : propsPinLabels

  for (const child of component.children) {
    if (child.componentName !== "Port") continue
    const port = child as Port
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const pinKey = `pin${pinNumber}`
    const labels = component._impliedFootprintPinLabels[pinKey]
    if (!labels) continue
    const labelList = Array.isArray(labels) ? labels : [labels]
    const propLabel =
      pinLabelsFromProps?.[pinKey] ?? pinLabelsFromProps?.[String(pinNumber)]

    if (propLabel === undefined && port.originDescription) {
      port.setProps({ name: pinKey })
    }

    if (pinLabelsBeforeFootprint[pinKey]) {
      port.setProps({ aliases: labelList })
    } else {
      port.externallyAddedAliases.push(...labelList)
    }
  }
}
