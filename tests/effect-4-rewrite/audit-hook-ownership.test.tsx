import { expect, test } from "bun:test"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { RootCircuit } from "lib/RootCircuit"
import { corePromise } from "lib/effect/core-error"
import { renderedCircuitHookEffect } from "lib/effect/rendered-circuit-hook"

test("React mount cancellation owns its delay and releases its circuit and pending jobs", async () => {
  const board = <board width={10} height={10} />
  let earlyCreations = 0
  const beforeMount = new AbortController()
  const earlyExit = Effect.runPromiseExit(
    renderedCircuitHookEffect({
      reactElements: board,
      createCircuit: () => {
        earlyCreations++
        return new RootCircuit()
      },
      onCircuit: () => {
        throw new Error("Aborted mount must not update state")
      },
      onCircuitJson: () => {},
      onRendered: () => {},
    }),
    { signal: beforeMount.signal },
  )
  beforeMount.abort()
  const aborted = await earlyExit
  expect(
    Exit.isFailure(aborted) && Cause.hasInterruptsOnly(aborted.cause),
  ).toBe(true)
  expect(earlyCreations).toBe(0)

  const circuit = new RootCircuit()
  const mounted = new AbortController()
  const rendered = Promise.withResolvers<void>()
  const callbacks: string[] = []
  const mountedExit = Effect.runPromiseExit(
    renderedCircuitHookEffect({
      reactElements: board,
      createCircuit: () => circuit,
      onCircuit: (ownedCircuit) => {
        expect(ownedCircuit).toBe(circuit)
        callbacks.push("circuit")
      },
      onCircuitJson: (circuitJson) => {
        expect(
          circuitJson.some((element) => element.type === "pcb_board"),
        ).toBe(true)
        callbacks.push("json")
      },
      onRendered: () => {
        callbacks.push("rendered")
        rendered.resolve()
      },
    }),
    { signal: mounted.signal },
  )
  await rendered.promise
  expect(circuit.effectRuntime.isDisposed).toBe(false)
  expect(callbacks).toEqual(["circuit", "json", "rendered"])
  let jobSignal: AbortSignal | undefined
  const pendingJob = circuit.effectRuntime.queue({
    owner: circuit.children[0],
    build: () =>
      corePromise((signal) => {
        jobSignal = signal
        return new Promise<void>(() => {})
      }),
  })
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  mounted.abort()
  const completed = await mountedExit
  await pendingJob
  expect(
    Exit.isFailure(completed) && Cause.hasInterruptsOnly(completed.cause),
  ).toBe(true)
  expect(jobSignal?.aborted).toBe(true)
  expect(circuit.effectRuntime.isDisposed).toBe(true)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  expect(callbacks).toEqual(["circuit", "json", "rendered"])
})
