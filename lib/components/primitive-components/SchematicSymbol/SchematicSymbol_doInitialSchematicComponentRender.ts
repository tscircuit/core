import type { SchematicPort } from "circuit-json"
import { getRelativeDirection } from "lib/utils/get-relative-direction"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { symbols } from "schematic-symbols"
import type { Port } from "../Port"
import type { SchematicSymbol } from "./SchematicSymbol"

const getDisplayPinLabel = (labels: string[]): string | undefined =>
  labels.find((label) => !/^(pin)?\d+$/.test(label))

const getConnectionNamesForSymbolPort = (labels: string[]): string[] => {
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

export const SchematicSymbol_doInitialSchematicComponentRender = (
  schematicSymbol: SchematicSymbol,
): void => {
  if (schematicSymbol.root?.schematicDisabled) return
  if (schematicSymbol.getCollapsedSchematicBoxAncestor()) return

  const { db } = schematicSymbol.root!
  const symbolName = schematicSymbol._getSchematicSymbolNameOrThrow()
  const symbol = symbols[symbolName]
  if (!symbol) {
    throw new Error(`No schematic symbol found for "${symbolName}"`)
  }

  const { chipRef, connections } = schematicSymbol._parsedProps
  if (chipRef && !connections) {
    throw new Error(
      `${schematicSymbol.getString()} with chipRef "${chipRef}" requires explicit connections`,
    )
  }
  if (connections && !chipRef) {
    throw new Error(
      `${schematicSymbol.getString()} with connections requires a chipRef`,
    )
  }

  const referencedChip = chipRef
    ? schematicSymbol.getSubcircuit().selectOne(chipRef)
    : null
  if (chipRef && !referencedChip?.source_component_id) {
    throw new Error(
      `Could not resolve chipRef "${chipRef}" for ${schematicSymbol.getString()}`,
    )
  }

  const usedConnectionNames = new Set<string>()
  const referencedSourcePortIds = new Map<
    (typeof symbol.ports)[number],
    string
  >()

  if (connections && referencedChip?.source_component_id) {
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

      referencedSourcePortIds.set(symbolPort, referencedPort.source_port_id)
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

  const center = schematicSymbol._getGlobalSchematicPositionBeforeLayout()
  const schematicSheetId = schematicSymbol._resolveSchematicSheetId()
  const subcircuitId =
    schematicSymbol.getSubcircuit().subcircuit_id ?? undefined
  const schematicComponent = db.schematic_component.insert({
    center,
    size: { ...symbol.size },
    is_box_with_pins: true,
    symbol_name: symbolName,
    source_component_id: referencedChip?.source_component_id ?? undefined,
    schematic_sheet_id: schematicSheetId,
  })

  schematicSymbol.schematic_component_id =
    schematicComponent.schematic_component_id

  for (const symbolPort of symbol.ports) {
    const pinNumber = getPinNumberFromLabels(symbolPort.labels)
    const portName =
      getDisplayPinLabel(symbolPort.labels) ??
      (pinNumber ? `pin${pinNumber}` : symbolPort.labels[0])
    if (!portName) continue

    const referencedSourcePortId = referencedSourcePortIds.get(symbolPort)
    const sourcePortId =
      referencedSourcePortId ??
      db.source_port.insert({
        name: portName,
        pin_number: pinNumber ? Number(pinNumber) : undefined,
        port_hints: [...symbolPort.labels],
        subcircuit_id: subcircuitId,
      }).source_port_id
    const portCenter = {
      x: center.x + symbolPort.x - symbol.center.x,
      y: center.y + symbolPort.y - symbol.center.y,
    }

    db.schematic_port.insert({
      schematic_component_id: schematicComponent.schematic_component_id,
      center: portCenter,
      source_port_id: sourcePortId,
      facing_direction: getRelativeDirection(
        center,
        portCenter,
      ) as SchematicPort["facing_direction"],
      distance_from_component_edge: 0.4,
      pin_number: pinNumber ? Number(pinNumber) : undefined,
      display_pin_label: getDisplayPinLabel(symbolPort.labels),
      is_connected: false,
      schematic_sheet_id: schematicSheetId,
      subcircuit_id: subcircuitId,
    })
  }
}
