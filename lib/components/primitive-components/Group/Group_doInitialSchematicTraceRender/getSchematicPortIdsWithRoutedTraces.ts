import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"

export const getSchematicPortIdsWithRoutedTraces = ({
  solver,
}: {
  solver: SchematicTracePipelineSolver
}): Set<SchematicPortId> => {
  const solvedTraces =
    solver.traceCleanupSolver?.getOutput().traces ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().traces ??
    solver.schematicTraceLinesSolver?.solvedTracePaths ??
    []
  const schematicPortIdsWithRoutedTraces = new Set<SchematicPortId>()

  for (const solvedTrace of solvedTraces) {
    const points = solvedTrace?.tracePath as Array<{ x: number; y: number }>
    if (!Array.isArray(points) || points.length < 2) continue
    const pinIds = Array.isArray(solvedTrace.pins)
      ? solvedTrace.pins.map((pin) => pin.pinId)
      : solvedTrace.pinIds

    for (const pinId of pinIds) {
      const schPortId = asSchematicPortId(pinId)
      if (schPortId) {
        schematicPortIdsWithRoutedTraces.add(schPortId)
      }
    }
  }

  return schematicPortIdsWithRoutedTraces
}
