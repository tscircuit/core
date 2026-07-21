import type { SchematicPort } from "circuit-json"

export const isInternalCircuitPortMapping = (
  firstPort: SchematicPort,
  secondPort: SchematicPort,
): boolean =>
  Boolean(
    (firstPort.is_internal_circuit_port &&
      secondPort.is_overlapping_internal_circuit_port) ||
      (firstPort.is_overlapping_internal_circuit_port &&
        secondPort.is_internal_circuit_port),
  )
