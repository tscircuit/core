import { expect, test } from "bun:test"
import type { AutorouterProgressEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  createCapacityAutorouterFixture,
  deferred,
} from "./capacity-mesh-autorouter-fixture"

test("routing reports cumulative steps between slices and reaches full progress", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const completed = deferred()
  const progress: AutorouterProgressEvent[] = []
  let routingDuringCompletion: boolean | undefined
  solver.stepAsync = async () => {
    await new Promise((resolve) => setTimeout(resolve, 130))
    solver.iterations++
    solver.progress = solver.iterations / 5
    solver.solved = solver.iterations === 4
  }
  autorouter.on("progress", (event) => progress.push(event))
  autorouter.on("complete", () => {
    routingDuringCompletion = autorouter.isRouting
    completed.resolve()
  })
  autorouter.on("error", (event) => completed.reject(event.error))

  autorouter.start()
  await completed.promise

  expect(progress.length).toBeGreaterThanOrEqual(2)
  expect(progress[0].steps).toBeLessThan(4)
  expect(progress.at(-1)?.steps).toBe(4)
  expect(progress.at(-1)?.progress).toBe(1)
  expect(progress.every((event) => event.phase === "test_phase")).toBe(true)
  expect(
    progress.every((event) => Number.isFinite(event.iterationsPerSecond)),
  ).toBe(true)
  expect(routingDuringCompletion).toBe(false)
})
