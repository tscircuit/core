import { expect, test } from "bun:test"
import {
  createCapacityAutorouterFixture,
  deferred,
} from "./capacity-mesh-autorouter-fixture"

test("a completion listener can restart the router without losing the new run", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const restartedRunCompleted = deferred()
  const routingDuringCompletion: boolean[] = []
  let completions = 0
  autorouter.on("complete", () => {
    routingDuringCompletion.push(autorouter.isRouting)
    completions++
    if (completions === 1) {
      autorouter.start()
    } else {
      restartedRunCompleted.resolve()
    }
  })
  autorouter.on("error", (event) => restartedRunCompleted.reject(event.error))

  autorouter.start()
  await restartedRunCompleted.promise

  expect(completions).toBe(2)
  expect(solver.iterations).toBe(1)
  expect(routingDuringCompletion).toEqual([false, false])
  expect(autorouter.isRouting).toBe(false)
})
