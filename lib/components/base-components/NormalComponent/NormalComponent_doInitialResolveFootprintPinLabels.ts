import { Port } from "lib/components/primitive-components/Port"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_doInitialResolveFootprintPinLabels(
  component: NormalComponent<any, any>,
) {
  const pinLabelsBeforeFootprint = component._impliedFootprintPinLabels ?? {}
  const pinLabels: Record<string, string[]> = {}
  const portsFromFootprint = component.getPortsFromFootprint()
  for (const port of portsFromFootprint) {
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

  const impliedFootprintPinLabels: Record<string, string[]> = { ...pinLabels }
  for (const [pinKey, labels] of Object.entries(pinLabelsBeforeFootprint)) {
    impliedFootprintPinLabels[pinKey] = Array.isArray(labels)
      ? labels
      : [labels]
  }

  component._impliedFootprintPinLabels = impliedFootprintPinLabels

  if (Object.keys(component._impliedFootprintPinLabels).length === 0) {
    return
  }

  for (const child of component.children) {
    if (child.componentName !== "Port") continue
    const port = child as Port
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const pinKey = `pin${pinNumber}`
    const labels = component._impliedFootprintPinLabels[pinKey]
    if (!labels) continue
    const labelList = Array.isArray(labels) ? labels : [labels]

    const existingLabels = port.getNameAndAliases()
    for (const label of labelList) {
      if (!existingLabels.includes(label)) {
        port.externallyAddedAliases.push(label)
      }
    }
  }
}
