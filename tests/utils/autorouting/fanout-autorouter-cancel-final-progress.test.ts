import { expect, test } from "bun:test"
import { createSteppableFanoutAutorouter } from "tests/fixtures/create-steppable-fanout-autorouter"

test("stopping fanout from its final progress handler suppresses completion", async () => {
  const { autorouter } = createSteppableFanoutAutorouter(1)
  const events: string[] = []
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("error", () => events.push("error"))
  await new Promise<void>((resolve) => {
    autorouter.on("progress", () => {
      events.push("progress")
      autorouter.stop()
      resolve()
    })
    autorouter.start()
  })
  await Bun.sleep(20)
  expect(events).toEqual(["progress"])
  expect(autorouter.isRouting).toBe(false)
  expect(autorouter.getOutputSimpleRouteJson()).toBeUndefined()
})
