import { expect, spyOn, test } from "bun:test"
import type { AutorouterProgressEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import { createSteppableFanoutAutorouter } from "tests/fixtures/create-steppable-fanout-autorouter"

test("fanout yields to timers and reports intermediate progress before completion", async () => {
  const { autorouter, solver } = createSteppableFanoutAutorouter()
  const visualize = spyOn(solver, "visualize")
  const preview = spyOn(solver, "preview")
  const progress: AutorouterProgressEvent[] = []
  let timerRan = false
  autorouter.on("progress", (event) => {
    progress.push(event)
    if (progress.length === 1) setTimeout(() => (timerRan = true), 0)
  })
  await new Promise<void>((resolve, reject) => {
    autorouter.on("error", ({ error }) => reject(error))
    autorouter.on("complete", () => {
      expect(timerRan).toBe(true)
      expect(autorouter.isRouting).toBe(false)
      resolve()
    })
    autorouter.start()
  })
  expect(progress.length).toBeGreaterThan(1)
  expect(progress[0]!.progress).toBeGreaterThan(0)
  expect(progress[0]!.progress).toBeLessThan(1)
  expect(progress.at(-1)).toMatchObject({
    steps: solver.iterations,
    progress: 1,
  })
  expect(autorouter.getOutputSimpleRouteJson()).toEqual(autorouter.input)
  expect(preview).toHaveBeenCalled()
  expect(visualize).toHaveBeenCalledTimes(1)
})
