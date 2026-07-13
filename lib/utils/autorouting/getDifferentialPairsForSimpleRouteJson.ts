import type { SourceTrace } from "circuit-json"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"

type DifferentialPairDefinition = {
  positiveConnection: string
  negativeConnection: string
  maxLengthSkew?: number
  subcircuitId: string | null
}

type SrjDifferentialPair = NonNullable<
  SimpleRouteJson["differentialPairs"]
>[number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const getDifferentialPairDefinition = (
  component: unknown,
): DifferentialPairDefinition | null => {
  if (!isRecord(component) || typeof component.getSubcircuit !== "function") {
    return null
  }

  const props: unknown = component._parsedProps
  if (
    !isRecord(props) ||
    typeof props.positiveConnection !== "string" ||
    typeof props.negativeConnection !== "string"
  ) {
    return null
  }

  const subcircuit: unknown = component.getSubcircuit()
  const subcircuitId: string | null =
    isRecord(subcircuit) && typeof subcircuit.subcircuit_id === "string"
      ? subcircuit.subcircuit_id
      : null

  return {
    positiveConnection: props.positiveConnection,
    negativeConnection: props.negativeConnection,
    maxLengthSkew:
      typeof props.maxLengthSkew === "number" ? props.maxLengthSkew : undefined,
    subcircuitId,
  }
}

/**
 * Converts differential-pair trace names into the connection names used by SRJ.
 */
export const getDifferentialPairsForSimpleRouteJson = ({
  connections,
  differentialPairComponents,
  sourceTraces,
  subcircuitId,
}: {
  connections: SimpleRouteConnection[]
  differentialPairComponents: unknown[]
  sourceTraces: SourceTrace[]
  subcircuitId?: string | null
}): SrjDifferentialPair[] | undefined => {
  const connectionNameBySourceTraceId: Map<string, string> = new Map()
  for (const connection of connections) {
    if (connection.source_trace_id) {
      connectionNameBySourceTraceId.set(
        connection.source_trace_id,
        connection.name,
      )
    }
  }

  const connectionNameByTraceName: Map<string, string> = new Map()
  for (const sourceTrace of sourceTraces) {
    if (!sourceTrace.name) continue

    const connectionName: string | undefined =
      connectionNameBySourceTraceId.get(sourceTrace.source_trace_id)
    if (connectionName) {
      connectionNameByTraceName.set(sourceTrace.name, connectionName)
    }
  }

  const differentialPairs: SrjDifferentialPair[] = []
  for (const component of differentialPairComponents) {
    const pair: DifferentialPairDefinition | null =
      getDifferentialPairDefinition(component)
    if (!pair || (subcircuitId && pair.subcircuitId !== subcircuitId)) {
      continue
    }

    const positiveConnection: string | undefined =
      connectionNameByTraceName.get(pair.positiveConnection)
    const negativeConnection: string | undefined =
      connectionNameByTraceName.get(pair.negativeConnection)
    if (!positiveConnection || !negativeConnection) continue

    const differentialPair: SrjDifferentialPair = {
      connectionNames: [positiveConnection, negativeConnection],
      lengthTolerance: pair.maxLengthSkew ?? 0.1,
    }
    differentialPairs.push(differentialPair)
  }

  return differentialPairs.length > 0 ? differentialPairs : undefined
}
