import type { BaseCircuitJsonError, SourcePort } from "circuit-json"
import {
  type ResolvedDifferentialPairConnection,
  resolveDifferentialPairConnectionOrThrow,
} from "lib/utils/autorouting/resolve-differential-pair-connection"
import type { DifferentialPair } from "./DifferentialPair"

type ConnectionPolarity =
  SourceDifferentialPairNotPointToPointError["connection_polarity"]
type SourceComponentId = NonNullable<SourcePort["source_component_id"]>

/**
 * Compatibility boundary for circuit-json#686. This can become an import from
 * circuit-json after that PR is released.
 */
export interface SourceDifferentialPairNotPointToPointError
  extends BaseCircuitJsonError {
  type: "source_differential_pair_not_point_to_point_error"
  source_differential_pair_not_point_to_point_error_id: string
  error_type: "source_differential_pair_not_point_to_point_error"
  subcircuit_id?: string
  differential_pair_name?: string
  connection_polarity: "positive" | "negative"
  connection_selector: string
  subcircuit_connectivity_map_key?: string
  source_net_id?: string
  connected_source_port_ids: string[]
}

type PointToPointErrorTable = {
  delete: (errorId: string) => void
  insert: (
    error: Omit<
      SourceDifferentialPairNotPointToPointError,
      "type" | "source_differential_pair_not_point_to_point_error_id"
    >,
  ) => SourceDifferentialPairNotPointToPointError
}

const getPointToPointErrorTable = (
  differentialPair: DifferentialPair,
): PointToPointErrorTable =>
  (
    differentialPair.root!.db as unknown as {
      source_differential_pair_not_point_to_point_error: PointToPointErrorTable
    }
  ).source_differential_pair_not_point_to_point_error

const formatTerminalPinList = (terminalPinSelectors: string[]): string => {
  if (terminalPinSelectors.length <= 1) return terminalPinSelectors.join("")
  if (terminalPinSelectors.length === 2) {
    return `${terminalPinSelectors[0]} and ${terminalPinSelectors[1]}`
  }
  return `${terminalPinSelectors.slice(0, -1).join(", ")}, and ${terminalPinSelectors.at(-1)}`
}

const getTerminalPinSelector = (
  sourcePort: SourcePort,
  sourceComponentsById: Map<SourceComponentId, { name: string }>,
): string => {
  const sourceComponent = sourcePort.source_component_id
    ? sourceComponentsById.get(sourcePort.source_component_id)
    : undefined
  if (!sourceComponent?.name) return sourcePort.source_port_id

  const portName =
    sourcePort.most_frequently_referenced_by_name ?? sourcePort.name
  return `.${sourceComponent.name} > .${portName}`
}

const getPointToPointErrorMessage = ({
  differentialPairName,
  connectionPolarity,
  connectionSelector,
  sourceNetName,
  terminalPinSelectors,
}: {
  differentialPairName: string
  connectionPolarity: ConnectionPolarity
  connectionSelector: string
  sourceNetName?: string
  terminalPinSelectors: string[]
}): string => {
  const resolvedConnectionName = sourceNetName
    ? `net.${sourceNetName}`
    : `"${connectionSelector}"`
  const terminalCount = terminalPinSelectors.length
  const pinOrPins = terminalCount === 1 ? "pin" : "pins"
  const terminalList = formatTerminalPinList(terminalPinSelectors)
  const suggestedSelector = terminalPinSelectors[0]
  const correction =
    terminalCount > 2
      ? "Remove the extra connection"
      : "Connect exactly two terminal pins"
  const selectorRecommendation = suggestedSelector
    ? ` and prefer a pin selector such as ${connectionPolarity}Connection="${suggestedSelector}"`
    : ""

  return (
    `Differential pair "${differentialPairName}" ${connectionPolarity}Connection resolves to ${resolvedConnectionName}, which is not point-to-point. ` +
    `It connects to ${terminalCount} ${pinOrPins}${terminalList ? `: ${terminalList}` : ""}. ` +
    `${correction}${selectorRecommendation}.`
  )
}

const removeStoredPointToPointErrors = (
  differentialPair: DifferentialPair,
): void => {
  const errorTable = getPointToPointErrorTable(differentialPair)
  for (const errorId of differentialPair._pointToPointErrorIds) {
    errorTable.delete(errorId)
  }
  differentialPair._pointToPointErrorIds = []
}

export const DifferentialPair_doInitialSourceDesignRuleChecks = (
  differentialPair: DifferentialPair,
): void => {
  const { db } = differentialPair.root!
  removeStoredPointToPointErrors(differentialPair)

  const sourceTraces = db.source_trace.list()
  const sourcePorts = db.source_port.list()
  const sourceNets = db.source_net.list()
  const pointToPointErrorTable = getPointToPointErrorTable(differentialPair)
  const sourceComponentsById = new Map<SourceComponentId, { name: string }>()
  for (const sourceComponent of db.source_component.list()) {
    sourceComponentsById.set(sourceComponent.source_component_id, {
      name: sourceComponent.name,
    })
  }

  for (const connectionPolarity of ["positive", "negative"] as const) {
    const connectionSelector =
      connectionPolarity === "positive"
        ? differentialPair._parsedProps.positiveConnection
        : differentialPair._parsedProps.negativeConnection

    let resolvedConnection: ResolvedDifferentialPairConnection
    try {
      resolvedConnection = resolveDifferentialPairConnectionOrThrow({
        differentialPair,
        traceNameOrPortSelector: connectionSelector,
        sourceTraces,
        sourcePorts,
        sourceNets,
      })
    } catch {
      // Missing and unrelated ambiguous references retain their existing SRJ
      // diagnostics. This DRC is specifically for resolved connectivity groups.
      continue
    }

    const terminalSourcePorts = [
      ...new Map(
        resolvedConnection.sourcePorts.map((sourcePort) => [
          sourcePort.source_port_id,
          sourcePort,
        ]),
      ).values(),
    ]
    if (terminalSourcePorts.length === 2) continue

    const terminalPinSelectors = terminalSourcePorts
      .map((sourcePort) =>
        getTerminalPinSelector(sourcePort, sourceComponentsById),
      )
      .sort((selectorA, selectorB) => selectorA.localeCompare(selectorB))
    const insertedError = pointToPointErrorTable.insert({
      error_type: "source_differential_pair_not_point_to_point_error",
      is_fatal: true,
      message: getPointToPointErrorMessage({
        differentialPairName: differentialPair.name,
        connectionPolarity,
        connectionSelector,
        sourceNetName: resolvedConnection.sourceNet?.name,
        terminalPinSelectors,
      }),
      subcircuit_id:
        differentialPair.getSubcircuit().subcircuit_id ?? undefined,
      differential_pair_name: differentialPair.name,
      connection_polarity: connectionPolarity,
      connection_selector: connectionSelector,
      subcircuit_connectivity_map_key:
        resolvedConnection.subcircuitConnectivityMapKey,
      source_net_id: resolvedConnection.sourceNet?.source_net_id,
      connected_source_port_ids: terminalSourcePorts
        .map((sourcePort) => sourcePort.source_port_id)
        .sort((sourcePortIdA, sourcePortIdB) =>
          sourcePortIdA.localeCompare(sourcePortIdB),
        ),
    })
    differentialPair._pointToPointErrorIds.push(
      insertedError.source_differential_pair_not_point_to_point_error_id,
    )
  }
}

export const DifferentialPair_removeSourceDesignRuleChecks = (
  differentialPair: DifferentialPair,
): void => {
  removeStoredPointToPointErrors(differentialPair)
}
