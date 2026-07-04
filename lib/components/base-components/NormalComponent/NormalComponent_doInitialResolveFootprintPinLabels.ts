import { Port } from "lib/components/primitive-components/Port"
import { isFootprinterString } from "./utils/isFootprinterString"
import type { NormalComponent } from "./NormalComponent"

const diodeDefaultAliasesByPin: Record<string, string[]> = {
  pin1: ["anode", "pos", "left"],
  pin2: ["cathode", "neg", "right"],
}
const diodeDefaultAliases = new Set(
  Object.values(diodeDefaultAliasesByPin).flat(),
)

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

  component._impliedFootprintPinLabels = {
    ...pinLabels,
    ...pinLabelsBeforeFootprint,
  }

  const shouldSuppressDiodeDefaultAliases =
    component.componentName === "Diode" &&
    portsFromFootprint.length > 0 &&
    !isFootprinterString(component.resolveFootprint())

  if (
    Object.keys(component._impliedFootprintPinLabels).length === 0 &&
    !shouldSuppressDiodeDefaultAliases
  ) {
    return
  }

  const aliasesClaimedByPin = new Map<string, string>()
  if (shouldSuppressDiodeDefaultAliases) {
    for (const [pinKey, labels] of Object.entries(
      component._impliedFootprintPinLabels,
    )) {
      const labelList = Array.isArray(labels) ? labels : [labels]
      for (const label of labelList) {
        if (diodeDefaultAliases.has(label)) {
          aliasesClaimedByPin.set(label, pinKey)
        }
      }
    }
  }

  for (const child of component.children) {
    if (child.componentName !== "Port") continue
    const port = child as Port
    const pinNumber = port._parsedProps.pinNumber
    if (pinNumber === undefined) continue

    const pinKey = `pin${pinNumber}`
    if (shouldSuppressDiodeDefaultAliases) {
      for (const alias of diodeDefaultAliases) {
        const claimedPin = aliasesClaimedByPin.get(alias)
        if (!claimedPin || claimedPin !== pinKey) {
          port.externallyExcludedAliases.add(alias)
        }
      }
    }

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
