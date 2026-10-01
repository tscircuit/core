import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import {
  simulateSpiceEffect,
  SpiceSimulationEngine,
} from "lib/effect/simulation-engine"

test("cancelling one noncooperative simulation does not close a shared platform engine or commit late results", async () => {
  const first = Promise.withResolvers<{
    simulationResultCircuitJson: AnyCircuitElement[]
  }>()
  const second = Promise.withResolvers<{
    simulationResultCircuitJson: AnyCircuitElement[]
  }>()
  const calls: string[] = []
  const engine = {
    simulate: (spiceString: string) => {
      calls.push(spiceString)
      return spiceString === "first" ? first.promise : second.promise
    },
  }
  const committed: string[] = []
  const controller = new AbortController()
  const program = (spiceString: string) =>
    simulateSpiceEffect(spiceString).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          committed.push(spiceString)
        }),
      ),
      Effect.provideService(SpiceSimulationEngine, engine),
    )
  const firstRun = Effect.runPromiseExit(program("first"), {
    signal: controller.signal,
  })
  const secondRun = Effect.runPromiseExit(program("second"))
  controller.abort()
  expect(Exit.isFailure(await firstRun)).toBe(true)
  first.resolve({ simulationResultCircuitJson: [] })
  second.resolve({ simulationResultCircuitJson: [] })
  expect(Exit.isSuccess(await secondRun)).toBe(true)
  expect(calls).toEqual(["first", "second"])
  expect(committed).toEqual(["second"])
})
