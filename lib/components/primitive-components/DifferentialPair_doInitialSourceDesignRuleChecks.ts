import type { SourcePort } from "circuit-json"
import type { DifferentialPair } from "./DifferentialPair"
import type { Port } from "./Port/Port"

type ConnectionPolarity = "positive" | "negative"
type SourceComponentId = NonNullable<SourcePort["source_component_id"]>

type ResolvedPointToPointConnection = {
  sourcePorts: SourcePort[]
  referenceKind: "trace" | "selector"
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

  return {
    sourcePorts,
    referenceKind: matchingSourceTraces.length > 0 ? "trace" : "selector",
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
  referenceKind,
  terminalPinSelectors,
}: {
  differentialPairName: string
  connectionPolarity: ConnectionPolarity
  connectionSelector: string
  referenceKind: ResolvedPointToPointConnection["referenceKind"]
  terminalPinSelectors: string[]
}): string => {
  const terminalCount = terminalPinSelectors.length
  const pinOrPins = terminalCount === 1 ? "terminal pin" : "terminal pins"
  const terminalList = formatTerminalPinList(terminalPinSelectors)
  const terminalListDescription = terminalList ? `: ${terminalList}` : ""
  const problem = terminalCount > 2 ? "ambiguous" : "not point-to-point"

  return `Differential pair "${differentialPairName}" ${connectionPolarity}Connection references ${referenceKind} "${connectionSelector}", which is ${problem} because it connects to ${terminalCount} ${pinOrPins}${terminalListDescription}.`
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
    let warningSourceComponentId = ""
    const firstTerminalSourcePort = terminalSourcePorts[0]
    if (firstTerminalSourcePort) {
      if (!firstTerminalSourcePort.source_component_id) {
        throw new Error(
          `Differential pair "${differentialPair.name}" resolved terminal port "${firstTerminalSourcePort.source_port_id}" without a source_component_id`,
        )
      }
      warningSourceComponentId = firstTerminalSourcePort.source_component_id
    }

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
        referenceKind: resolvedConnection.referenceKind,
        terminalPinSelectors,
      }),
      subcircuit_id:
        differentialPair.getSubcircuit().subcircuit_id ?? undefined,
    })
  }
}
