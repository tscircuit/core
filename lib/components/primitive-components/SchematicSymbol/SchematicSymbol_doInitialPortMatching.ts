import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { type SchSymbol, symbols } from "schematic-symbols"
import type { Port } from "../Port"
import type { SchematicSymbol } from "./SchematicSymbol"

export const getConnectionNamesForSymbolPort = (labels: string[]): string[] => {
  const connectionNames = new Set(labels)
  const pinNumber = getPinNumberFromLabels(labels)
  if (pinNumber) connectionNames.add(`pin${pinNumber}`)
  return [...connectionNames]
}

const getSingleConnectionTarget = (
  connectionName: string,
  target: string | readonly string[],
): string => {
  const targets = Array.isArray(target) ? target : [target]
  if (targets.length !== 1) {
    throw new Error(
      `SchematicSymbol connection "${connectionName}" must select exactly one physical port`,
    )
  }
  return targets[0]
}

export interface MappedSchematicSymbolPort {
  symbolPort: SchSymbol["ports"][number]
  referencedPort: Port
}

export const SchematicSymbol_doInitialPortMatching = (
  schematicSymbol: SchematicSymbol,
): void => {
  const { db } = schematicSymbol.root!
  const { chipRef, connections } = schematicSymbol._parsedProps

  schematicSymbol.mappedPorts = []

  if (chipRef && !connections) {
    db.source_property_ignored_warning.insert({
      source_component_id: schematicSymbol.source_component_id!,
      property_name: "chipRef",
      message: `${schematicSymbol.getString()} has chipRef "${chipRef}" without connections. chipRef will be ignored.`,
      error_type: "source_property_ignored_warning",
      subcircuit_id: schematicSymbol.getSubcircuit().subcircuit_id ?? undefined,
    })
    return
  }

  if (connections && !chipRef) {
    db.source_property_ignored_warning.insert({
      source_component_id: schematicSymbol.source_component_id!,
      property_name: "connections",
      message: `${schematicSymbol.getString()} has connections without chipRef. connections will be ignored.`,
      error_type: "source_property_ignored_warning",
      subcircuit_id: schematicSymbol.getSubcircuit().subcircuit_id ?? undefined,
    })
    return
  }

  if (!chipRef || !connections) return

  const symbolName = schematicSymbol._getSchematicSymbolNameOrThrow()
  const symbol = symbols[symbolName]
  if (!symbol) {
    throw new Error(`No schematic symbol found for "${symbolName}"`)
  }

  const referencedChip = schematicSymbol.getSubcircuit().selectOne(chipRef)
  if (!referencedChip?.source_component_id) {
    throw new Error(
      `Could not resolve chipRef "${chipRef}" for ${schematicSymbol.getString()}`,
    )
  }

  const usedConnectionNames = new Set<string>()

  for (const symbolPort of symbol.ports) {
    const connectionNames = getConnectionNamesForSymbolPort(symbolPort.labels)
    const matchingConnections = Object.entries(connections).filter(
      ([connectionName]) => connectionNames.includes(connectionName),
    )

    if (matchingConnections.length === 0) {
      throw new Error(
        `${schematicSymbol.getString()} is missing an explicit connection for symbol port "${symbolPort.labels.join("/")}"`,
      )
    }
    if (matchingConnections.length > 1) {
      throw new Error(
        `${schematicSymbol.getString()} has multiple connections for symbol port "${symbolPort.labels.join("/")}"`,
      )
    }

    const [connectionName, connectionTarget] = matchingConnections[0]
    usedConnectionNames.add(connectionName)
    const targetSelector = getSingleConnectionTarget(
      connectionName,
      connectionTarget,
    )
    const referencedPort = schematicSymbol
      .getSubcircuit()
      .selectOne(targetSelector, { type: "port" }) as Port | null

    if (!referencedPort?.source_port_id) {
      throw new Error(
        `Could not resolve connection "${connectionName}" target "${targetSelector}" for ${schematicSymbol.getString()}`,
      )
    }

    const referencedSourcePort = db.source_port.get(
      referencedPort.source_port_id,
    )
    if (
      referencedSourcePort?.source_component_id !==
      referencedChip.source_component_id
    ) {
      throw new Error(
        `Connection "${connectionName}" target "${targetSelector}" does not belong to chipRef "${chipRef}"`,
      )
    }

    schematicSymbol.mappedPorts.push({ symbolPort, referencedPort })
  }

  const unusedConnectionNames = Object.keys(connections).filter(
    (connectionName) => !usedConnectionNames.has(connectionName),
  )
  if (unusedConnectionNames.length > 0) {
    throw new Error(
      `${schematicSymbol.getString()} has connections that do not match symbol ports: ${unusedConnectionNames.join(", ")}`,
    )
  }
}
