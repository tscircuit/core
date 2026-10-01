import { expect, test } from "bun:test"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import { routingInput } from "./routing-fixture"

test("built-in fiber facades preserve observer state and cancel scheduled work", async () => {
  const capacity = new TscircuitAutorouter(routingInput)
  Object.defineProperty(capacity, "solver", {
    value: { failed: true, error: "controlled failure" },
  })
  const failureStates: boolean[] = []
  capacity.on("error", () => failureStates.push(capacity.isRouting))
  capacity.start()
  expect(failureStates).toEqual([true])
  expect(capacity.isRouting).toBe(false)

  const bus = new BusLanesAutorouter(routingInput)
  Object.defineProperty(bus, "solver", {
    value: { solved: true, failed: false, traces: [] },
  })
  let signalComplete!: () => void
  const completed = new Promise<void>((resolve) => {
    signalComplete = resolve
  })
  const completeStates: boolean[] = []
  bus.on("complete", () => {
    completeStates.push(bus.isRouting)
    signalComplete()
  })
  bus.start()
  await completed
  expect(completeStates).toEqual([false])
  expect(bus.isRouting).toBe(false)

  const fanout = new FanoutAutorouter(routingInput, { mode: "fanout" })
  let events = 0
  fanout.on("complete", () => {
    events++
  })
  fanout.on("error", () => {
    events++
  })
  fanout.on("progress", () => {
    events++
  })
  fanout.start()
  fanout.stop()
  await new Promise((resolve) => setTimeout(resolve, 5))
  expect(events).toBe(0)
  expect(fanout.isRouting).toBe(false)
})
