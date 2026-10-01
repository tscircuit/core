import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { corePromise } from "lib/effect/core-error"
import { createHttpRoutingFixture } from "./routing-http-fixture"

test("a delayed cancelled finalizer cannot reset a replacement routing generation", async () => {
  const { circuit, board } = createHttpRoutingFixture()
  let signalFirst!: () => void
  let signalSecond!: () => void
  let releaseCleanup!: () => void
  let finishSecond!: () => void
  const firstStarted = new Promise<void>((resolve) => {
    signalFirst = resolve
  })
  const secondStarted = new Promise<void>((resolve) => {
    signalSecond = resolve
  })
  const firstCleanup = new Promise<void>((resolve) => {
    releaseCleanup = resolve
  })
  const secondWork = new Promise<void>((resolve) => {
    finishSecond = resolve
  })
  const completions: Array<() => void> = []
  const firstEnded = new Promise<void>((resolve) => {
    completions.push(resolve)
  })
  const secondEnded = new Promise<void>((resolve) => {
    completions.push(resolve)
  })
  circuit.on("asyncEffect:end", () => {
    completions.shift()?.()
  })
  let calls = 0
  board._runHttpAutoroutingEffect = (job) =>
    Effect.suspend(() => {
      const generation = ++calls
      const work = Effect.gen(function* () {
        if (generation === 1) {
          signalFirst()
          yield* corePromise(() => new Promise<void>(() => {}))
        } else {
          signalSecond()
          yield* corePromise(() => secondWork)
          job.commit(() => {
            board._asyncAutoroutingResult = { output_pcb_traces: [] }
          })
        }
      })
      return generation === 1
        ? work.pipe(Effect.ensuring(Effect.promise(() => firstCleanup)))
        : work
    })
  board._startAsyncAutorouting()
  await firstStarted
  circuit.effectRuntime.cancelSubtree(board)
  expect(board._hasStartedAsyncAutorouting).toBe(false)
  board._startAsyncAutorouting()
  await secondStarted
  expect(board._hasStartedAsyncAutorouting).toBe(true)
  releaseCleanup()
  await firstEnded
  expect(board._hasStartedAsyncAutorouting).toBe(true)
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  finishSecond()
  await secondEnded
  expect(calls).toBe(2)
  expect(board._hasStartedAsyncAutorouting).toBe(true)
  expect(board._asyncAutoroutingResult).toEqual({ output_pcb_traces: [] })
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
