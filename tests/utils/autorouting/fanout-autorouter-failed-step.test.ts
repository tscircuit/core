import { expect, test } from "bun:test"
import { createSteppableFanoutAutorouter } from "tests/fixtures/create-steppable-fanout-autorouter"

test("fanout reports a step failure once and stops scheduling work", async () => {
  const { autorouter, solver } = createSteppableFanoutAutorouter()
  const failure = new Error("step failed")
  solver.step = () => {
    solver.iterations++
    throw failure
  }
  const events: string[] = []
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("progress", () => events.push("progress"))
  const error = await new Promise<Error>((resolve) => {
    autorouter.on("error", ({ error }) => {
      events.push("error")
      resolve(error)
    })
    autorouter.start()
  })
  await Bun.sleep(20)
  expect(error).toBe(failure)
  expect(events).toEqual(["error"])
  expect(solver.iterations).toBe(1)
  expect(autorouter.isRouting).toBe(false)
})
