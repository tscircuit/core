import { expect, test } from "bun:test"
import {
  createCapacityAutorouterFixture,
  deferred,
  waitForRoutingTimer,
} from "./capacity-mesh-autorouter-fixture"

test("a progress listener can stop routing without leaving a scheduled cycle", async () => {
  const { autorouter } = createCapacityAutorouterFixture()
  const stopped = deferred()
  let completions = 0
  autorouter.on("progress", () => {
    autorouter.stop()
    stopped.resolve()
  })
  autorouter.on("complete", () => completions++)
  autorouter.on("error", (event) => stopped.reject(event.error))

  autorouter.start()
  await stopped.promise
  await waitForRoutingTimer()

  expect(completions).toBe(0)
  expect(autorouter.isRouting).toBe(false)
  expect(
    (autorouter as unknown as { timeoutId?: unknown }).timeoutId,
  ).toBeUndefined()
})
