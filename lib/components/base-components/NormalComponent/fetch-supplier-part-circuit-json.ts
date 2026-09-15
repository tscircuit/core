import type { PartsEngine, SupplierName } from "@tscircuit/props"
import type { NormalComponent } from "./NormalComponent"

type SupplierPartKey = `${SupplierName}:${string}`
type SupplierPartResult = ReturnType<
  NonNullable<PartsEngine["fetchPartCircuitJson"]>
>

// Share pending and completed lookups between analysis phases within a circuit.
// Keep engines isolated and allow results to be collected with their circuit.
const circuitFetches = new WeakMap<
  NonNullable<NormalComponent<any, any>["root"]>,
  WeakMap<
    PartsEngine,
    Map<SupplierPartKey, Promise<Awaited<SupplierPartResult>>>
  >
>()

export function fetchSupplierPartCircuitJson(
  component: NormalComponent<any, any>,
  partsEngine: PartsEngine,
  supplierName: SupplierName,
  supplierPartNumber: string,
) {
  const root = component.root!
  let engineFetches = circuitFetches.get(root)
  if (!engineFetches) {
    engineFetches = new WeakMap()
    circuitFetches.set(root, engineFetches)
  }
  let fetches = engineFetches.get(partsEngine)
  if (!fetches) {
    fetches = new Map()
    engineFetches.set(partsEngine, fetches)
  }
  const key: SupplierPartKey = `${supplierName}:${supplierPartNumber}`
  const existing = fetches.get(key)
  if (existing) return existing

  const result = Promise.resolve().then(() =>
    partsEngine.fetchPartCircuitJson!({
      supplierPartNumber,
      platformFetch: root.platform?.platformFetch,
    }),
  )
  fetches.set(key, result)
  return result
}
