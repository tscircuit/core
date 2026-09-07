import { expect, test } from "bun:test"
import type { AutorouterProgressEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  createCapacityAutorouterFixture,
  deferred,
  waitForRoutingTimer,
} from "./capacity-mesh-autorouter-fixture"

test("incomplete routing yields progress and can be cancelled between slices", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const stopped = deferred()
  const progress: AutorouterProgressEvent[] = []
  let completions = 0
  solver.stepAsync = async () => {
    await new Promise((resolve) => setTimeout(resolve, 130))
    solver.iterations++
    solver.progress = 0.1
  }
  autorouter.on("progress", (event) => {
    progress.push(event)
    autorouter.stop()
    stopped.resolve()
  })
  autorouter.on("complete", () => completions++)
  autorouter.on("error", (event) => stopped.reject(event.error))

  autorouter.start()
  await stopped.promise
  await waitForRoutingTimer()

  expect(progress).toHaveLength(1)
  expect(progress[0].progress).toBe(0.1)
  expect(progress[0].steps).toBe(solver.iterations)
  expect(solver.solved).toBe(false)
  expect(completions).toBe(0)
  expect(autorouter.isRouting).toBe(false)
  expect(
    (autorouter as unknown as { timeoutId?: unknown }).timeoutId,
  ).toBeUndefined()
})
