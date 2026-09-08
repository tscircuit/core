import { expect, test } from "bun:test"
import { createSteppableFanoutAutorouter } from "tests/fixtures/create-steppable-fanout-autorouter"

test("a fanout restart from progress does not complete the cancelled run", async () => {
  const { autorouter, solver } = createSteppableFanoutAutorouter(1)
  const events: string[] = []
  let restarted = false
  autorouter.on("progress", () => {
    events.push("progress")
    if (restarted) return
    restarted = true
    autorouter.stop()
    solver.iterations = 0
    solver.solved = false
    autorouter.start()
  })
  await new Promise<void>((resolve, reject) => {
    autorouter.on("error", ({ error }) => reject(error))
    autorouter.on("complete", () => {
      events.push("complete")
      resolve()
    })
    autorouter.start()
  })
  await Bun.sleep(20)
  expect(events).toEqual(["progress", "progress", "complete"])
  expect(solver.iterations).toBe(1)
  expect(autorouter.isRouting).toBe(false)
})
