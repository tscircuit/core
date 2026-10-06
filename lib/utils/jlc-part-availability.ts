import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import { z } from "zod"

/** JLCPCB identifiers normalized at the supplier API boundary. */
export type JlcPartNumber = `C${number}`

export const normalizeJlcPartNumber = (
  partNumber: string,
): JlcPartNumber | null => {
  const normalized = partNumber.trim().toUpperCase()
  if (!/^C?\d+$/.test(normalized)) return null
  return `C${normalized.replace(/^C/, "")}` as JlcPartNumber
}

const jlcSearchResponse = z.object({
  components: z.array(
    z.object({
      lcsc: z.union([z.number(), z.string()]),
      stock: z.number().finite().nonnegative().nullable().optional(),
    }),
  ),
})

// Share concurrent lookups only. A new circuit or a later update fetches again.
const pendingAvailabilityChecks = new WeakMap<
  IsolatedCircuit,
  WeakMap<typeof fetch, Map<JlcPartNumber, Promise<boolean>>>
>()

const fetchAvailability = async (
  partNumber: JlcPartNumber,
  platformFetch: typeof fetch,
): Promise<boolean> => {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<false>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort()
      resolve(false)
    }, 10_000)
  })
  const lookup = async () => {
    try {
      const response = await platformFetch(
        `https://jlcsearch.tscircuit.com/api/search?q=${encodeURIComponent(partNumber)}&limit=1`,
        { signal: controller.signal, cache: "no-store" },
      )
      if (!response.ok) return false
      const parsed = jlcSearchResponse.safeParse(await response.json())
      if (!parsed.success) return false
      const supplierPart = parsed.data.components.find(
        (part) => normalizeJlcPartNumber(String(part.lcsc)) === partNumber,
      )
      return supplierPart?.stock != null && supplierPart.stock > 0
    } catch {
      // Unknown availability is advisory, including network and service failures.
      return false
    }
  }
  try {
    return await Promise.race([lookup(), timedOut])
  } finally {
    clearTimeout(timeout)
  }
}

export const checkJlcPartAvailability = (
  circuit: IsolatedCircuit,
  partNumber: JlcPartNumber,
): Promise<boolean> => {
  const platformFetch = circuit.platform?.platformFetch ?? globalThis.fetch
  let checksByFetch = pendingAvailabilityChecks.get(circuit)
  if (!checksByFetch) {
    checksByFetch = new WeakMap()
    pendingAvailabilityChecks.set(circuit, checksByFetch)
  }
  let pendingChecks = checksByFetch.get(platformFetch)
  if (!pendingChecks) {
    pendingChecks = new Map()
    checksByFetch.set(platformFetch, pendingChecks)
  }
  const pending = pendingChecks.get(partNumber)
  if (pending) return pending
  const availability = fetchAvailability(partNumber, platformFetch).finally(
    () => {
      pendingChecks.delete(partNumber)
    },
  )
  pendingChecks.set(partNumber, availability)
  return availability
}
