import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Trace } from "../Trace/Trace"

export function Group_shouldAllowDuplicateChildName(
  childrenWithSameName: PrimitiveComponent[],
): boolean {
  if (childrenWithSameName.length <= 1) return true

  const sameNamedTraces = childrenWithSameName.filter(
    (child): child is Trace => child instanceof Trace,
  )

  if (sameNamedTraces.length !== childrenWithSameName.length) {
    return false
  }

  const mutuallyConnectedTraceKeys = sameNamedTraces.map(
    (trace) => trace.subcircuit_connectivity_map_key,
  )

  if (mutuallyConnectedTraceKeys.some((key) => !key)) {
    return false
  }

  // Traces can intentionally share a name only when they are pieces of the
  // same underlying connection. The subcircuit connectivity map key is the
  // canonical proof that they are mutually connected.
  return new Set(mutuallyConnectedTraceKeys).size === 1
}
