import type { AnySourceComponent } from "circuit-json"
import type {
  SimpleRouteConnection,
  SrjConnectionName,
} from "./SimpleRouteJson"

type TerminalComponentName = AnySourceComponent["name"]

const getBreakoutTerminalComponentOrThrow = (
  connection: SimpleRouteConnection,
  differentialPairName: string,
): TerminalComponentName => {
  const componentNames = new Set(
    connection.pointsToConnect.flatMap((point) => {
      if (!point.port_selector) return []
      return [
        point.port_selector.slice(0, point.port_selector.lastIndexOf(".")),
      ]
    }),
  )
  if (componentNames.size !== 1) {
    throw new Error(
      `Differential pair "${differentialPairName}" needs one component-qualified terminal per breakout connection`,
    )
  }
  return [...componentNames][0]
}

/** Match multiple local net escapes by terminal component, never declaration order. */
export const matchDifferentialPairSrjConnections = (
  positiveConnections: SimpleRouteConnection[],
  negativeConnections: SimpleRouteConnection[],
  differentialPairName: string,
): [SrjConnectionName, SrjConnectionName][] => {
  if (positiveConnections.length === 1 && negativeConnections.length === 1) {
    return [[positiveConnections[0].name, negativeConnections[0].name]]
  }
  const negativeConnectionsByComponent = new Map<
    TerminalComponentName,
    SimpleRouteConnection
  >()
  for (const connection of negativeConnections) {
    const componentName = getBreakoutTerminalComponentOrThrow(
      connection,
      differentialPairName,
    )
    if (negativeConnectionsByComponent.has(componentName)) {
      throw new Error(
        `Differential pair "${differentialPairName}" has ambiguous breakout terminals on "${componentName}"`,
      )
    }
    negativeConnectionsByComponent.set(componentName, connection)
  }
  const pairedNames: [SrjConnectionName, SrjConnectionName][] = []
  for (const positiveConnection of positiveConnections) {
    const componentName = getBreakoutTerminalComponentOrThrow(
      positiveConnection,
      differentialPairName,
    )
    const negativeConnection = negativeConnectionsByComponent.get(componentName)
    if (!negativeConnection) {
      throw new Error(
        `Differential pair "${differentialPairName}" has unmatched breakout terminals on "${componentName}"`,
      )
    }
    pairedNames.push([positiveConnection.name, negativeConnection.name])
    negativeConnectionsByComponent.delete(componentName)
  }
  if (negativeConnectionsByComponent.size > 0) {
    throw new Error(
      `Differential pair "${differentialPairName}" has unmatched negative breakout terminals`,
    )
  }
  return pairedNames
}
