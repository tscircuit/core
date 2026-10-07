import type {
  FetchPartAvailabilityParams,
  PartsEngine,
  SupplierName,
} from "@tscircuit/props"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"

type SupplierPartAvailabilityKey = `${SupplierName}:${string}`
const pendingAvailabilityChecks = new WeakMap<
  IsolatedCircuit,
  WeakMap<
    PartsEngine,
    Map<SupplierPartAvailabilityKey, Promise<boolean | undefined>>
  >
>()

const fetchAvailability = async (
  partsEngine: PartsEngine,
  request: FetchPartAvailabilityParams,
): Promise<boolean | undefined> => {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<false>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort()
      resolve(false)
    }, 10_000)
  })
  try {
    const availability = Promise.resolve()
      .then(() =>
        partsEngine.fetchPartAvailability!({
          ...request,
          signal: controller.signal,
        }),
      )
      .then((result) =>
        result === undefined
          ? undefined
          : result.stock !== null && result.stock > 0,
      )
      .catch(() => false)
    return await Promise.race([availability, timedOut])
  } finally {
    clearTimeout(timeout)
  }
}

export const checkPartAvailability = (
  circuit: IsolatedCircuit,
  {
    partsEngine,
    ...request
  }: FetchPartAvailabilityParams & { partsEngine: PartsEngine },
): Promise<boolean | undefined> => {
  let checksByEngine = pendingAvailabilityChecks.get(circuit)
  if (!checksByEngine) {
    checksByEngine = new WeakMap()
    pendingAvailabilityChecks.set(circuit, checksByEngine)
  }
  let pendingChecks = checksByEngine.get(partsEngine)
  if (!pendingChecks) {
    pendingChecks = new Map()
    checksByEngine.set(partsEngine, pendingChecks)
  }
  const key: SupplierPartAvailabilityKey = `${request.supplierName}:${request.supplierPartNumber}`
  const pending = pendingChecks.get(key)
  if (pending) return pending
  const availability = fetchAvailability(partsEngine, {
    ...request,
    platformFetch: circuit.platform?.platformFetch,
  }).finally(() => {
    pendingChecks.delete(key)
  })
  pendingChecks.set(key, availability)
  return availability
}
