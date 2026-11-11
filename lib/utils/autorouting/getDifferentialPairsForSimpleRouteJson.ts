import type { SourceDifferentialPairBus } from "circuit-json"
import type {
  SimpleRouteConnection,
  SimpleRouteDifferentialPair,
} from "./SimpleRouteJson"

/** Circuit JSON is authoritative: copy exact hop ownership and lane order. */
export const getDifferentialPairsForSimpleRouteJson = ({
  srjConnections,
  sourcePairs,
}: {
  srjConnections: SimpleRouteConnection[]
  sourcePairs: SourceDifferentialPairBus[]
}): SimpleRouteDifferentialPair[] | undefined => {
  if (!sourcePairs.length) return undefined
  return sourcePairs.map((pair) => {
    for (const id of pair.source_trace_ids) {
      const connections = srjConnections.filter(
        (connection) =>
          connection.name === id && connection.source_trace_id === id,
      )
      if (
        connections.length !== 1 ||
        connections[0]!.pointsToConnect.length !== 2 ||
        connections[0]!.routingPcbGroupId
      ) {
        throw new Error(
          `Differential pair "${pair.name || "unnamed pair"}": each hop needs exactly two routable terminals; phased, preserved and breakout splitting is unsupported`,
        )
      }
    }
    return {
      connectionNames: [
        pair.differential_pair.positive_source_trace_ids,
        pair.differential_pair.negative_source_trace_ids,
      ],
      maxLengthSkewMm: pair.max_length_skew,
    }
  })
}
