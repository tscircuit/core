import type { Port } from "../Port"
import type { SchematicSymbol } from "./SchematicSymbol"

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

export const SchematicSymbol_doInitialPortMatching = (
  schematicSymbol: SchematicSymbol,
): void => {
  const { db } = schematicSymbol.root!
  const { chipRef, connections } = schematicSymbol._parsedProps

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

  const referencedChip = schematicSymbol.getSubcircuit().selectOne(chipRef)
  if (!referencedChip?.source_component_id) {
    throw new Error(
      `Could not resolve chipRef "${chipRef}" for ${schematicSymbol.getString()}`,
    )
  }

  const usedConnectionNames = new Set<string>()

  for (const schematicPort of schematicSymbol.ports) {
    const symbolPort = schematicPort.schematicSymbolPortDef!
    const matchingConnections = Object.entries(connections).filter(
      ([connectionName]) => schematicPort.isMatchingAnyOf([connectionName]),
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
    const physicalPort = schematicSymbol
      .getSubcircuit()
      .selectOne<Port>(targetSelector, { type: "port" })

    if (!physicalPort?.source_port_id) {
      throw new Error(
        `Could not resolve connection "${connectionName}" target "${targetSelector}" for ${schematicSymbol.getString()}`,
      )
    }

    const physicalSourcePort = db.source_port.get(physicalPort.source_port_id)
    if (
      physicalSourcePort?.source_component_id !==
      referencedChip.source_component_id
    ) {
      throw new Error(
        `Connection "${connectionName}" target "${targetSelector}" does not belong to chipRef "${chipRef}"`,
      )
    }

    schematicPort.source_port_id = physicalPort.source_port_id
    schematicPort.source_component_id = physicalPort.source_component_id
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
