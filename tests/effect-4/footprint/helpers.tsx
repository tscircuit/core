import { RootCircuit } from "lib/RootCircuit"
import type {
  EffectFootprintLoadingOptions,
  FootprintFetch,
} from "lib/utils/footprint/effect-footprint-loader"
import "lib/register-catalogue"
import "tests/fixtures/extend-expect-circuit-snapshot"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

export const footprintUrl = "https://footprint.test/R_0402.json"
export const footprintResponse = () => Response.json(external0402Footprint)

interface ControlledFootprintRequest {
  url: string
  signal: AbortSignal
  resolve: (response: Response) => void
  reject: (cause: unknown) => void
  abortCount: number
  hasAbortListener: boolean
}

export function createControlledFootprintFetch({ ignoreAbort = false } = {}) {
  const requests: ControlledFootprintRequest[] = []
  const fetchFootprint: FootprintFetch = (url, options) =>
    new Promise((resolve, reject) => {
      const signal = options.signal
      if (!signal)
        throw new Error("Owned footprint fetch did not receive signal")
      const cleanup = () => {
        signal.removeEventListener("abort", onAbort)
        request.hasAbortListener = false
      }
      const request: ControlledFootprintRequest = {
        url,
        signal,
        abortCount: 0,
        hasAbortListener: true,
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
        request.abortCount++
        if (!ignoreAbort) request.reject(signal.reason)
      }
      signal.addEventListener("abort", onAbort, { once: true })
      requests.push(request)
      if (signal.aborted) onAbort()
    })
  return { fetchFootprint, requests }
}

export function createFootprintCircuit(
  experimentalFootprintLoading?: EffectFootprintLoadingOptions,
) {
  const circuit = new RootCircuit({
    platform: { routingDisabled: true },
    experimentalFootprintLoading,
  })
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint={footprintUrl} />
      <pcbnotetext pcbY={-3} text="Effect 4: cancellable HTTP R_0402" />
    </board>,
  )
  return circuit
}

export const flushFootprintContinuations = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0))
