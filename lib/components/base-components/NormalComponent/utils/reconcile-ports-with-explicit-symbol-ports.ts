import { Port } from "lib/components/primitive-components/Port"
import type { NormalComponent } from "../NormalComponent"
import { canMergePortDefinitions } from "./canMergePortDefinitions"

export const reconcilePortsWithExplicitSymbolPorts = (
  normalComponent: NormalComponent,
): Port[] => {
  const symbol = normalComponent.children.find(
    (child) => child.componentName === "Symbol",
  )
  if (!symbol) return []

  const explicitSymbolPorts = symbol.children.filter(
    (child): child is Port => child instanceof Port,
  )
  if (explicitSymbolPorts.length === 0) return []

  const implicitComponentPorts = normalComponent.children.filter(
    (child): child is Port =>
      child instanceof Port && child.originDescription !== null,
  )

  for (const explicitSymbolPort of explicitSymbolPorts) {
    const matchingImplicitPortIndex = implicitComponentPorts.findIndex(
      (implicitComponentPort) =>
        canMergePortDefinitions(explicitSymbolPort, implicitComponentPort),
    )
    if (matchingImplicitPortIndex === -1) continue

    const matchingImplicitPort =
      implicitComponentPorts[matchingImplicitPortIndex]!
    const aliasesToMerge = matchingImplicitPort
      .getNameAndAliases()
      .filter(
        (alias) => !explicitSymbolPort.getNameAndAliases().includes(alias),
      )
    explicitSymbolPort.externallyAddedAliases.push(...aliasesToMerge)
    normalComponent.remove(matchingImplicitPort)
    implicitComponentPorts.splice(matchingImplicitPortIndex, 1)
  }

  return explicitSymbolPorts
}
