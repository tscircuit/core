import type { PlatformConfig } from "@tscircuit/props"
import { RootCircuit as Circuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

export { external0402Footprint }

export function loadingRevisionDeferred<A>() {
  let resolve!: (value: A) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<A>((resolveValue, rejectValue) => {
    resolve = resolveValue
    reject = rejectValue
  })
  return { promise, resolve, reject }
}

export async function flushLoadingRevisionMicrotasks(turns = 64) {
  for (let turn = 0; turn < turns; turn++) await Promise.resolve()
}

export function createLoadingRevisionCircuit(platform: PlatformConfig = {}) {
  return new Circuit({
    platform: {
      routingDisabled: true,
      enablePartOrientationAnalysis: false,
      ...platform,
    },
  })
}

/** Disposal is new at the head; parity fixtures also run against the baseline. */
export async function disposeLoadingRevisionCircuit(circuit: Circuit) {
  if ("dispose" in circuit) await circuit.dispose()
}

export function reportLoadingRevisionObservation(
  hypothesis: string,
  scenario: string,
  observation: unknown,
) {
  console.log(
    JSON.stringify({
      revision_loading_observation: true,
      hypothesis,
      scenario,
      observation,
    }),
  )
}
