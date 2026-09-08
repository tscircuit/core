import { expect, test } from "bun:test"
import type { AutorouterProgressEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  createCapacityAutorouterFixture,
  deferred,
  waitForRoutingTimer,
} from "./capacity-mesh-autorouter-fixture"

test("restarting waits for the cancelled run's pending step without overlapping it", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const stepStarted = deferred()
  const finishStep = deferred()
  const completed = deferred()
  const progress: AutorouterProgressEvent[] = []
  let stepCalls = 0
  let activeSteps = 0
  let maxActiveSteps = 0
  solver.stepAsync = async () => {
    stepCalls++
    activeSteps++
    maxActiveSteps = Math.max(maxActiveSteps, activeSteps)
    if (stepCalls === 1) {
      stepStarted.resolve()
      await finishStep.promise
    } else {
      solver.solved = true
    }
    solver.iterations++
    activeSteps--
  }
  autorouter.on("progress", (event) => progress.push(event))
  autorouter.on("complete", completed.resolve)
  autorouter.on("error", (event) => completed.reject(event.error))

  autorouter.start()
  await stepStarted.promise
  autorouter.stop()
  autorouter.start()
  await waitForRoutingTimer()
  const callsBeforeFinishingCancelledStep = stepCalls
  finishStep.resolve()
  await completed.promise

  expect(callsBeforeFinishingCancelledStep).toBe(1)
  expect(stepCalls).toBe(2)
  expect(maxActiveSteps).toBe(1)
  expect(progress.map((event) => event.steps)).toEqual([1])
  expect(autorouter.isRouting).toBe(false)
})
