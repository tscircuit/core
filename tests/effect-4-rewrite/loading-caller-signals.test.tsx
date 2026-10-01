import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { loadCircuitJsonFootprint } from "lib/effect/loading"
import {
  createLoadingCircuit,
  createLoadingFetch,
  withLoadingFetch,
} from "./loading-fixture"

test("internal loading requests preserve caller cancellation alongside owning scope cancellation", async () => {
  const { platformFetch, requests } = createLoadingFetch()
  await withLoadingFetch(platformFetch, async () => {
    const circuit = createLoadingCircuit()
    circuit.add(<board />)
    circuit.render()
    const owner = circuit.firstChild!
    const caller = new AbortController()
    const failed = circuit.effectRuntime.queue({
      owner,
      build: () =>
        loadCircuitJsonFootprint("https://loading.test/part.json", {
          signal: caller.signal,
        }).pipe(Effect.asVoid),
    })
    caller.abort("caller abort")
    await expect(failed).rejects.toBe("caller abort")
    expect(requests[0].signal.aborted).toBe(true)
    expect(requests[0].listening).toBe(false)
    const nextCaller = new AbortController()
    const cancelled = circuit.effectRuntime.queue({
      owner,
      build: () =>
        loadCircuitJsonFootprint("https://loading.test/part.json", {
          signal: nextCaller.signal,
        }).pipe(Effect.asVoid),
    })
    circuit.effectRuntime.cancelSubtree(owner)
    await cancelled
    expect(requests[1].signal.aborted).toBe(true)
    expect(nextCaller.signal.aborted).toBe(false)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
    await circuit.dispose()
  })
})
