import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver";

export const getSchematicPortIdsWithRoutedTraces = ({
  solver,
  pinIdToSchematicPortId,
}: {
  solver: SchematicTracePipelineSolver;
  pinIdToSchematicPortId: Map<string, string>;
}): Set<string> => {
  const solvedTraces = solver.schematicTraceLinesSolver!.solvedTracePaths;
  const schematicPortIdsWithRoutedTraces = new Set<string>();

  for (const solvedTrace of solvedTraces) {
    for (const pinId of solvedTrace.pinIds) {
      const schPortId = pinIdToSchematicPortId.get(pinId);
      if (schPortId) {
        schematicPortIdsWithRoutedTraces.add(schPortId);
      }
    }
  }

  return schematicPortIdsWithRoutedTraces;
};
