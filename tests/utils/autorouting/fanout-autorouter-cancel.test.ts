import { expect, test } from "bun:test"
import { createSteppableFanoutAutorouter } from "tests/fixtures/create-steppable-fanout-autorouter"

test("a timer can cancel fanout between slices without further work or events", async () => {
  const { autorouter, solver } = createSteppableFanoutAutorouter()
  const events: string[] = []
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("error", () => events.push("error"))
  await new Promise<void>((resolve) => {
    autorouter.on("progress", () => {
      events.push("progress")
      setTimeout(() => {
        autorouter.stop()
        resolve()
      }, 0)
    })
    autorouter.start()
  })
  const stepsAtStop = solver.iterations
  await Bun.sleep(20)
  expect(stepsAtStop).toBeGreaterThan(0)
  expect(solver.solved).toBe(false)
  expect(solver.iterations).toBe(stepsAtStop)
  expect(events).toEqual(["progress"])
  expect(autorouter.isRouting).toBe(false)
  expect(autorouter.getOutputSimpleRouteJson()).toBeUndefined()
})
