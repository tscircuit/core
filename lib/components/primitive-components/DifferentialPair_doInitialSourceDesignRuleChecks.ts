import type { SourcePort } from "circuit-json"
import {
  type ResolvedDifferentialPairConnection,
  resolveDifferentialPairConnectionOrThrow,
} from "lib/utils/autorouting/resolve-differential-pair-connection"
import type { DifferentialPair } from "./DifferentialPair"

type ConnectionPolarity = "positive" | "negative"
type SourceComponentId = NonNullable<SourcePort["source_component_id"]>

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

const getPointToPointWarningMessage = ({
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

const removeStoredPointToPointWarnings = (
  differentialPair: DifferentialPair,
): void => {
  const warningTable = differentialPair.root!.db.source_property_ignored_warning
  for (const warningId of differentialPair._pointToPointWarningIds) {
    warningTable.delete(warningId)
  }
  differentialPair._pointToPointWarningIds = []
}

export const DifferentialPair_doInitialSourceDesignRuleChecks = (
  differentialPair: DifferentialPair,
): void => {
  const { db } = differentialPair.root!
  removeStoredPointToPointWarnings(differentialPair)

  const sourceTraces = db.source_trace.list()
  const sourcePorts = db.source_port.list()
  const sourceNets = db.source_net.list()
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
    const warningSourceComponentId = terminalSourcePorts[0]?.source_component_id
    if (!warningSourceComponentId) continue

    const terminalPinSelectors = terminalSourcePorts
      .map((sourcePort) =>
        getTerminalPinSelector(sourcePort, sourceComponentsById),
      )
      .sort((selectorA, selectorB) => selectorA.localeCompare(selectorB))
    const insertedWarning = db.source_property_ignored_warning.insert({
      source_component_id: warningSourceComponentId,
      property_name: `${connectionPolarity}Connection`,
      error_type: "source_property_ignored_warning",
      message: getPointToPointWarningMessage({
        differentialPairName: differentialPair.name,
        connectionPolarity,
        connectionSelector,
        sourceNetName: resolvedConnection.sourceNet?.name,
        terminalPinSelectors,
      }),
      subcircuit_id:
        differentialPair.getSubcircuit().subcircuit_id ?? undefined,
    })
    differentialPair._pointToPointWarningIds.push(
      insertedWarning.source_property_ignored_warning_id,
    )
  }
}

export const DifferentialPair_removeSourceDesignRuleChecks = (
  differentialPair: DifferentialPair,
): void => {
  removeStoredPointToPointWarnings(differentialPair)
}
