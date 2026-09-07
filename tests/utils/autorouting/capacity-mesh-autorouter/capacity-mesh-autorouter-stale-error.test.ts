import { expect, test } from "bun:test"
import {
  createCapacityAutorouterFixture,
  deferred,
} from "./capacity-mesh-autorouter-fixture"

test("an asynchronous rejection from a cancelled run does not fail its replacement", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const stepStarted = deferred()
  const finishStep = deferred()
  const completed = deferred()
  const errors: Error[] = []
  let stepCalls = 0
  solver.stepAsync = async () => {
    stepCalls++
    if (stepCalls === 1) {
      stepStarted.resolve()
      await finishStep.promise
    }
    solver.iterations++
    solver.solved = true
  }
  autorouter.on("complete", completed.resolve)
  autorouter.on("error", (event) => errors.push(event.error))

  autorouter.start()
  await stepStarted.promise
  autorouter.stop()
  autorouter.start()
  finishStep.reject(new Error("cancelled step rejected"))
  await completed.promise

  expect(stepCalls).toBe(2)
  expect(errors).toEqual([])
  expect(autorouter.isRouting).toBe(false)
})
