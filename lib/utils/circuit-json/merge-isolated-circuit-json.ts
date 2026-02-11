import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"

/**
 * Merges Circuit JSON elements from an isolated subcircuit render into the
 * main circuit's database. All IDs are prefixed with a unique string to
 * prevent collisions with the main circuit's IDs.
 *
 * Any property whose key ends with `_id` and whose value is a non-empty
 * string will be prefixed (unless it's a well-known non-id field). Array
 * values whose key ends with `_ids` are also processed.
 */
export function mergeIsolatedCircuitJson(
  mainDb: CircuitJsonUtilObjects,
  isolatedElements: AnyCircuitElement[],
  idPrefix: string,
): void {
  const mainArray = mainDb.toArray() as AnyCircuitElement[]

  for (const element of isolatedElements) {
    const remapped = remapElementIds(element, idPrefix)
    mainArray.push(remapped)
  }
}

function remapElementIds(
  element: AnyCircuitElement,
  prefix: string,
): AnyCircuitElement {
  const remapped = { ...element } as Record<string, any>

  for (const [key, value] of Object.entries(remapped)) {
    if (key === "type") continue

    // Handle array of IDs (e.g., source_port_ids, pcb_component_ids)
    if (key.endsWith("_ids") && Array.isArray(value)) {
      remapped[key] = value.map((v: any) =>
        typeof v === "string" && v.length > 0 ? `${prefix}${v}` : v,
      )
      continue
    }

    // Handle single ID fields
    if (key.endsWith("_id") && typeof value === "string" && value.length > 0) {
      remapped[key] = `${prefix}${value}`
    }
  }

  return remapped as AnyCircuitElement
}
