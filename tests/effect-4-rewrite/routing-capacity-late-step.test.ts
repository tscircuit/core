import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { routingInput } from "./routing-fixture"

test("stopped capacity fibers ignore a late noncancellable solver step", async () => {
  const router = new TscircuitAutorouter(routingInput)
  let finishStep!: () => void
  let steps = 0
  let events = 0
  const pendingStep = new Promise<void>((resolve) => {
    finishStep = resolve
  })
  const controlledSolver = {
    solved: false,
    failed: false,
    iterations: 0,
    stepAsync: () => {
      steps++
      return pendingStep
    },
  }
  Object.defineProperty(router, "solver", { value: controlledSolver })
  router.on("progress", () => {
    events++
  })
  router.on("complete", () => {
    events++
  })
  router.on("error", () => {
    events++
  })
  router.start()
  expect(steps).toBe(1)
  router.stop()
  controlledSolver.solved = true
  finishStep()
  await pendingStep
  await new Promise((resolve) => setTimeout(resolve, 5))
  expect(router.isRouting).toBe(false)
  expect(events).toBe(0)
  expect(steps).toBe(1)
})
