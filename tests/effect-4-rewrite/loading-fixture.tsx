import type { PlatformConfig } from "@tscircuit/props"
import { spyOn } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

export { external0402Footprint }

export function loadingDeferred<A>() {
  let resolve!: (value: A) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<A>((resolveValue, rejectValue) => {
    resolve = resolveValue
    reject = rejectValue
  })
  return { promise, resolve, reject }
}

export const flushLoading = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0))

export function createLoadingCircuit(platform: PlatformConfig = {}) {
  return new RootCircuit({ platform: { routingDisabled: true, ...platform } })
}

export const loadingSupplierPads: AnyCircuitElement[] = [1, 2].map((pin) => ({
  type: "pcb_smtpad",
  pcb_smtpad_id: `supplier_pad_${pin}`,
  shape: "rect",
  x: pin === 1 ? 1 : -1,
  y: 0,
  width: 0.5,
  height: 0.8,
  layer: "top",
  port_hints: [`pin${pin}`],
}))

export const loadingOrientationChip = (name: string) => (
  <chip name={name} supplierPartNumbers={{ jlcpcb: ["shared"] }}>
    <footprint>
      <smtpad
        pcbX={-1}
        width={0.5}
        height={0.8}
        shape="rect"
        portHints={["pin1"]}
      />
      <smtpad
        pcbX={1}
        width={0.5}
        height={0.8}
        shape="rect"
        portHints={["pin2"]}
      />
    </footprint>
  </chip>
)

interface ControlledLoadingRequest {
  url: string
  signal: AbortSignal
  resolve(response: Response): void
  reject(cause: unknown): void
  listening: boolean
}

export function createLoadingFetch({ ignoreAbort = false } = {}) {
  const requests: ControlledLoadingRequest[] = []
  const platformFetch: typeof fetch = Object.assign(
    (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
      const signal = options?.signal
      if (!signal)
        return Promise.reject(new Error("Loading fetch must be owned"))
      return new Promise<Response>((resolve, reject) => {
        const cleanup = () => {
          request.listening = false
          signal.removeEventListener("abort", onAbort)
        }
        const request: ControlledLoadingRequest = {
          url:
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : input.url,
          signal,
          listening: true,
          resolve: (response) => {
            cleanup()
            resolve(response)
          },
          reject: (cause) => {
            cleanup()
            reject(cause)
          },
        }
        const onAbort = () => {
          if (!ignoreAbort) request.reject(signal.reason)
        }
        signal.addEventListener("abort", onAbort, { once: true })
        requests.push(request)
        if (signal.aborted) onAbort()
      })
    },
    { preconnect: fetch.preconnect },
  )
  return { platformFetch, requests }
}

export async function withLoadingFetch<A>(
  platformFetch: typeof fetch,
  run: () => Promise<A>,
) {
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(platformFetch)
  try {
    return await run()
  } finally {
    fetchSpy.mockRestore()
  }
}
