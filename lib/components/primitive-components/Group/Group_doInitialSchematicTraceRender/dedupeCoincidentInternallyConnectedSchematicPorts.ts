import type { Group } from "../Group"

type CircuitDb = NonNullable<Group<any>["root"]>["db"]

const areAtSamePosition = (
  a: { center: { x: number; y: number } },
  b: { center: { x: number; y: number } },
) => a.center.x === b.center.x && a.center.y === b.center.y

const areSourcePortsInternallyConnected = (
  db: CircuitDb,
  sourcePortIdA: string,
  sourcePortIdB: string,
) => {
  const sourcePortA = db.source_port.get(sourcePortIdA)
  const sourcePortB = db.source_port.get(sourcePortIdB)
  if (
    !sourcePortA?.source_component_id ||
    sourcePortA.source_component_id !== sourcePortB?.source_component_id
  ) {
    return false
  }

  const sourceComponent = db.source_component.get(
    sourcePortA.source_component_id,
  )
  return sourceComponent?.internally_connected_source_port_ids?.some(
    (sourcePortIds) =>
      sourcePortIds.includes(sourcePortIdA) &&
      sourcePortIds.includes(sourcePortIdB),
  )
}

/**
 * A multi-pad part can expose several physical source ports through one
 * schematic-symbol port. When equivalent pads are connected to the same net,
 * only hand that coincident endpoint to the schematic solver once.
 */
export const dedupeCoincidentInternallyConnectedSchematicPorts = ({
  db,
  schematicPortIds,
}: {
  db: CircuitDb
  schematicPortIds: string[]
}) => {
  const uniqueSchematicPortIds: string[] = []

  for (const schematicPortId of schematicPortIds) {
    const schematicPort = db.schematic_port.get(schematicPortId)
    if (!schematicPort?.source_port_id) continue

    const isDuplicate = uniqueSchematicPortIds.some((uniqueSchematicPortId) => {
      const uniqueSchematicPort = db.schematic_port.get(uniqueSchematicPortId)
      if (!uniqueSchematicPort?.source_port_id) return false

      return (
        schematicPort.schematic_component_id ===
          uniqueSchematicPort.schematic_component_id &&
        areAtSamePosition(schematicPort, uniqueSchematicPort) &&
        areSourcePortsInternallyConnected(
          db,
          schematicPort.source_port_id,
          uniqueSchematicPort.source_port_id,
        )
      )
    })

    if (!isDuplicate) uniqueSchematicPortIds.push(schematicPortId)
  }

  return uniqueSchematicPortIds
}
