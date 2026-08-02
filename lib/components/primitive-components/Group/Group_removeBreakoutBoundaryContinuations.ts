import type {
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

export function Group_removeBreakoutBoundaryContinuations(
  simpleRouteJson: SimpleRouteJson,
  routingPhasePlan: RoutingPhasePlan,
): SimpleRouteJson {
  const routingPcbGroupId = routingPhasePlan.routingPcbGroupId
  if (!routingPcbGroupId) return simpleRouteJson

  const connections = simpleRouteJson.connections.filter(
    (connection) => connection.routingPcbGroupId !== routingPcbGroupId,
  )
  if (connections.length === simpleRouteJson.connections.length) {
    return simpleRouteJson
  }

  const includedConnectionNames = new Set(
    connections.map((connection) => connection.name),
  )
  const differentialPairs: SimpleRouteDifferentialPair[] = []
  for (const differentialPair of simpleRouteJson.differentialPairs ?? []) {
    const positiveConnectionIncluded = includedConnectionNames.has(
      differentialPair.connectionNames[0],
    )
    const negativeConnectionIncluded = includedConnectionNames.has(
      differentialPair.connectionNames[1],
    )
    if (positiveConnectionIncluded !== negativeConnectionIncluded) {
      throw new Error(
        `Differential pair "${differentialPair.connectionNames.join("/")}" cannot be split at a breakout boundary`,
      )
    }
    if (positiveConnectionIncluded) differentialPairs.push(differentialPair)
  }

  const buses = (simpleRouteJson.buses ?? [])
    .map((bus) => ({
      ...bus,
      connectionNames: bus.connectionNames.filter((connectionName) =>
        includedConnectionNames.has(connectionName),
      ),
    }))
    .filter((bus) => bus.connectionNames.length > 0)

  return {
    ...simpleRouteJson,
    connections,
    differentialPairs:
      differentialPairs.length > 0 ? differentialPairs : undefined,
    buses: buses.length > 0 ? buses : undefined,
  }
}
