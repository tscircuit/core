import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicPort } from "circuit-json"

/**
 * Geometry-based solvers only need one endpoint when multiple schematic ports
 * represent the same symbol terminal. Prefer the port owned by the rendered
 * schematic component while leaving every schematic_port record intact.
 */
export const getSchematicPortSolverEndpoints = ({
  db,
  schematicPorts,
}: {
  db: CircuitJsonUtilObjects
  schematicPorts: SchematicPort[]
}): SchematicPort[] => {
  const isPortOwnedByRenderedSchematicComponent = (
    schematicPort: SchematicPort,
  ) => {
    const sourcePort = db.source_port.get(schematicPort.source_port_id)
    const schematicComponent = schematicPort.schematic_component_id
      ? db.schematic_component.get(schematicPort.schematic_component_id)
      : undefined

    if (
      !sourcePort?.source_component_id ||
      !schematicComponent?.source_component_id
    ) {
      return false
    }

    return (
      sourcePort.source_component_id === schematicComponent.source_component_id
    )
  }

  const schematicPortsWithComponentOwnedPortsFirst = schematicPorts.toSorted(
    (schematicPortA, schematicPortB) =>
      Number(isPortOwnedByRenderedSchematicComponent(schematicPortB)) -
      Number(isPortOwnedByRenderedSchematicComponent(schematicPortA)),
  )

  return schematicPortsWithComponentOwnedPortsFirst.filter(
    (schematicPort, index) =>
      !schematicPortsWithComponentOwnedPortsFirst
        .slice(0, index)
        .some(
          (previousSchematicPort) =>
            previousSchematicPort.center.x === schematicPort.center.x &&
            previousSchematicPort.center.y === schematicPort.center.y,
        ),
  )
}
