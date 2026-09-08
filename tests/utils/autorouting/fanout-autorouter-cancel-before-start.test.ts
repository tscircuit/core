import { expect, spyOn, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"

test("stopping fanout before start or from solver-started runs no solver steps", async () => {
  const step = spyOn(FanoutSolver.prototype, "step")
  const events: string[] = []
  let solverStarted = false
  const autorouter = new FanoutAutorouter(
    {
      layerCount: 2,
      minTraceWidth: 0.2,
      bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
      obstacles: [],
      connections: [],
    },
    {
      mode: "fanout",
      fanoutBounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
      onSolverStarted: () => {
        solverStarted = true
        autorouter.stop()
      },
    },
  )
  autorouter.on("progress", () => events.push("progress"))
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("error", () => events.push("error"))
  try {
    autorouter.start()
    autorouter.stop()
    await Bun.sleep(20)
    expect(solverStarted).toBe(false)
    autorouter.start()
    await Bun.sleep(20)
    expect(solverStarted).toBe(true)
    expect(step).not.toHaveBeenCalled()
    expect(events).toEqual([])
    expect(autorouter.isRouting).toBe(false)
  } finally {
    autorouter.stop()
    step.mockRestore()
  }
})
