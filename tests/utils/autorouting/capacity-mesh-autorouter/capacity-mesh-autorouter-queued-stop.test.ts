import { expect, test } from "bun:test"
import type { AutorouterEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import {
  createCapacityAutorouterFixture,
  waitForRoutingTimer,
} from "./capacity-mesh-autorouter-fixture"

test("routing can be cancelled before its first scheduled step", async () => {
  const { autorouter, solver } = createCapacityAutorouterFixture()
  const events: AutorouterEvent[] = []
  autorouter.on("progress", (event) => events.push(event))
  autorouter.on("complete", (event) => events.push(event))
  autorouter.on("error", (event) => events.push(event))

  autorouter.start()
  autorouter.stop()
  await waitForRoutingTimer()

  expect(solver.iterations).toBe(0)
  expect(events).toEqual([])
  expect(autorouter.isRouting).toBe(false)
})
