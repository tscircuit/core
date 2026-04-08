import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const createTestSimpleRouteJson = (): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [],
  connections: [
    {
      name: "conn1",
      pointsToConnect: [
        { x: 0, y: 0, layer: "top" },
        { x: 1, y: 1, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
})

test("CapacityMeshAutorouter uses stepAsync when available", async () => {
  const autorouter = new TscircuitAutorouter(createTestSimpleRouteJson())

  let stepCallCount = 0
  let stepAsyncCallCount = 0

  const fakeSolver = {
    solved: false,
    failed: false,
    error: undefined,
    iterations: 0,
    progress: 0,
    step() {
      stepCallCount++
      this.iterations++
      this.solved = true
    },
    async stepAsync() {
      stepAsyncCallCount++
      this.iterations++
      this.solved = true
    },
    getOutputSimpleRouteJson() {
      return {
        traces: [{ type: "pcb_trace", route: [] }],
      }
    },
    getCurrentPhase() {
      return "fake_phase"
    },
    preview() {
      return undefined
    },
  }
  ;(autorouter as any).solver = fakeSolver

  await new Promise<void>((resolve, reject) => {
    autorouter.on("complete", () => resolve())
    autorouter.on("error", (ev) => reject(ev.error))
    autorouter.start()
  })

  expect(stepAsyncCallCount).toBeGreaterThan(0)
  expect(stepCallCount).toBe(0)
})
