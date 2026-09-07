import { expect, test } from "bun:test"
import type { AutorouterEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  createCapacityAutorouterFixture,
  deferred,
  waitForRoutingTimer,
} from "./capacity-mesh-autorouter-fixture"

test("stopping during an asynchronous step suppresses further work and events", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const stepStarted = deferred()
  const finishStep = deferred()
  const events: AutorouterEvent[] = []
  let stepCalls = 0
  solver.stepAsync = async () => {
    stepCalls++
    stepStarted.resolve()
    await finishStep.promise
    solver.iterations++
    solver.solved = true
  }
  autorouter.on("progress", (event) => events.push(event))
  autorouter.on("complete", (event) => events.push(event))
  autorouter.on("error", (event) => events.push(event))

  autorouter.start()
  await stepStarted.promise
  autorouter.stop()
  finishStep.resolve()
  await waitForRoutingTimer()

  expect(stepCalls).toBe(1)
  expect(events).toEqual([])
  expect(autorouter.isRouting).toBe(false)
})
