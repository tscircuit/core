import type { InflatorContext, SourceSubcircuitId } from "../InflatorFn"

/** Select the restored scope for a classed net or trace before source render.
 * Group instances still carry their original source IDs during inflation, so
 * trace selectors are generated relative to the same scope as their nets. */
export function getInflatedNetClassContext(
  context: InflatorContext,
  sourceSubcircuitId: SourceSubcircuitId | undefined,
): InflatorContext {
  if (sourceSubcircuitId === undefined) return context
  const subcircuit = context.netClassSubcircuits?.get(sourceSubcircuitId)
  return subcircuit ? { ...context, subcircuit } : context
}
