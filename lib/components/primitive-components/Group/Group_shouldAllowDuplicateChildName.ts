import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Trace } from "../Trace/Trace"

export function Group_shouldAllowDuplicateChildName(
  childrenWithSameName: PrimitiveComponent[],
): boolean {
  return Group_getDuplicateChildNameViolationKind(childrenWithSameName) === null
}

export function Group_getDuplicateChildNameViolationKind(
  childrenWithSameName: PrimitiveComponent[],
):
  | "duplicate_trace_name_without_shared_connectivity"
  | "duplicate_child_name"
  | null {
  if (childrenWithSameName.length <= 1) return null

  const sameNamedTraces = childrenWithSameName.filter(
    (child): child is Trace => child instanceof Trace,
  )

  if (sameNamedTraces.length !== childrenWithSameName.length) {
    return "duplicate_child_name"
  }

  const mutuallyConnectedTraceKeys = sameNamedTraces.map(
    (trace) => trace.subcircuit_connectivity_map_key,
  )

  if (mutuallyConnectedTraceKeys.some((key) => !key)) {
    return "duplicate_trace_name_without_shared_connectivity"
  }

  // Traces can intentionally share a name only when they are pieces of the
  // same underlying connection. The subcircuit connectivity map key is the
  // canonical proof that they are mutually connected.
  return new Set(mutuallyConnectedTraceKeys).size === 1
    ? null
    : "duplicate_trace_name_without_shared_connectivity"
}

export function Group_getDuplicateChildNameErrorMessage({
  name,
  subcircuitName,
  childrenWithSameName,
}: {
  name: string
  subcircuitName?: string
  childrenWithSameName: PrimitiveComponent[]
}) {
  const violationKind =
    Group_getDuplicateChildNameViolationKind(childrenWithSameName)
  const displaySubcircuitName = subcircuitName || "unnamed"

  if (violationKind === "duplicate_trace_name_without_shared_connectivity") {
    return `Trace "${name}" in subcircuit "${displaySubcircuitName}" shares a name with another trace, but the traces are not mutually connected. Same-named traces must have the same subcircuit connectivity map key.`
  }

  if (violationKind === "duplicate_child_name") {
    return `Multiple immediate children found with name "${name}" in subcircuit "${displaySubcircuitName}". Names must be unique.`
  }

  return null
}
