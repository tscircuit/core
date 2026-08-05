import type { SourcePort } from "circuit-json"
import type { DifferentialPair } from "./DifferentialPair"
import type { Port } from "./Port/Port"

type ConnectionPolarity = "positive" | "negative"
type SourceComponentId = NonNullable<SourcePort["source_component_id"]>

type ResolvedPointToPointConnection = {
  sourcePorts: SourcePort[]
  sourceNetName?: string
}

const resolvePointToPointConnection = (
  differentialPair: DifferentialPair,
  connectionSelector: string,
): ResolvedPointToPointConnection | undefined => {
  const { db } = differentialPair.root!
  const subcircuit = differentialPair.getSubcircuit()
  const subcircuitSourceTraces = db.source_trace
    .list()
    .filter(
      (sourceTrace) => sourceTrace.subcircuit_id === subcircuit.subcircuit_id,
    )
  const matchingSourceTraces = subcircuitSourceTraces.filter(
    (sourceTrace) => sourceTrace.name === connectionSelector,
  )
  const connectivityMapKeys = new Set<string>()

  if (matchingSourceTraces.length > 0) {
    for (const sourceTrace of matchingSourceTraces) {
      if (sourceTrace.subcircuit_connectivity_map_key) {
        connectivityMapKeys.add(sourceTrace.subcircuit_connectivity_map_key)
      }
    }
  } else {
    const selectedPort = subcircuit.selectOne<Port>(connectionSelector, {
      type: "port",
    })
    if (selectedPort?.source_port_id) {
      const sourcePort = db.source_port.get(selectedPort.source_port_id)
      if (sourcePort?.subcircuit_connectivity_map_key) {
        connectivityMapKeys.add(sourcePort.subcircuit_connectivity_map_key)
      }
    }
  }

  if (connectivityMapKeys.size !== 1) return undefined
  const connectivityMapKey = connectivityMapKeys.values().next().value
  if (!connectivityMapKey) return undefined

  const sourcePorts = db.source_port
    .list()
    .filter(
      (sourcePort) =>
        sourcePort.subcircuit_connectivity_map_key === connectivityMapKey,
    )
  const sourceNet = db.source_net
    .list()
    .find(
      (sourceNet) =>
        sourceNet.subcircuit_connectivity_map_key === connectivityMapKey,
    )

  return {
    sourcePorts,
    sourceNetName: sourceNet?.name,
  }
}

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
  let sourceComponent: { name: string } | undefined
  if (sourcePort.source_component_id) {
    sourceComponent = sourceComponentsById.get(sourcePort.source_component_id)
  }
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
  let resolvedConnectionName = `"${connectionSelector}"`
  if (sourceNetName) {
    resolvedConnectionName = `net.${sourceNetName}`
  }
  const terminalCount = terminalPinSelectors.length
  let pinOrPins = "pins"
  if (terminalCount === 1) {
    pinOrPins = "pin"
  }
  const terminalList = formatTerminalPinList(terminalPinSelectors)
  const suggestedSelector = terminalPinSelectors[0]
  let correction = "Connect exactly two terminal pins"
  if (terminalCount > 2) {
    correction = "Remove the extra connection"
  }
  let selectorRecommendation = ""
  if (suggestedSelector) {
    selectorRecommendation = ` and prefer a pin selector such as ${connectionPolarity}Connection="${suggestedSelector}"`
  }
  let terminalListDescription = ""
  if (terminalList) {
    terminalListDescription = `: ${terminalList}`
  }

  return (
    `Differential pair "${differentialPairName}" ${connectionPolarity}Connection resolves to ${resolvedConnectionName}, which is not point-to-point. ` +
    `It connects to ${terminalCount} ${pinOrPins}${terminalListDescription}. ` +
    `${correction}${selectorRecommendation}.`
  )
}

export const DifferentialPair_doInitialSourceDesignRuleChecks = (
  differentialPair: DifferentialPair,
): void => {
  const { db } = differentialPair.root!

  const sourceComponentsById = new Map<SourceComponentId, { name: string }>()
  for (const sourceComponent of db.source_component.list()) {
    sourceComponentsById.set(sourceComponent.source_component_id, {
      name: sourceComponent.name,
    })
  }

  for (const connectionPolarity of ["positive", "negative"] as const) {
    let connectionSelector = differentialPair._parsedProps.negativeConnection
    if (connectionPolarity === "positive") {
      connectionSelector = differentialPair._parsedProps.positiveConnection
    }

    const resolvedConnection = resolvePointToPointConnection(
      differentialPair,
      connectionSelector,
    )
    if (!resolvedConnection) continue

    const terminalSourcePorts = resolvedConnection.sourcePorts
    if (terminalSourcePorts.length === 2) continue
    const warningSourceComponentId =
      terminalSourcePorts[0]?.source_component_id ??
      differentialPair.source_component_id ??
      ""

    const terminalPinSelectors = terminalSourcePorts
      .map((sourcePort) =>
        getTerminalPinSelector(sourcePort, sourceComponentsById),
      )
      .sort((selectorA, selectorB) => selectorA.localeCompare(selectorB))
    db.source_property_ignored_warning.insert({
      source_component_id: warningSourceComponentId,
      property_name: `${connectionPolarity}Connection`,
      error_type: "source_property_ignored_warning",
      message: getPointToPointWarningMessage({
        differentialPairName: differentialPair.name,
        connectionPolarity,
        connectionSelector,
        sourceNetName: resolvedConnection.sourceNetName,
        terminalPinSelectors,
      }),
      subcircuit_id:
        differentialPair.getSubcircuit().subcircuit_id ?? undefined,
    })
  }
}
