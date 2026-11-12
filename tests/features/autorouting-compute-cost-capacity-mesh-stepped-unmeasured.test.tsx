import { expect, test } from "bun:test"
import { renderCapacityMeshComputeCostBoard } from "tests/fixtures/render-compute-cost-board"

test("capacity mesh omits computeCostSummary on stepped progress when the solver has none", async () => {
  const { circuit, progress, autorouter } =
    await renderCapacityMeshComputeCostBoard({
      autorouterThreads: 1,
      measured: false,
    })
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autorouter.getComputeCostSummary()).toBeUndefined()
  expect(progress.length).toBeGreaterThan(0)
  for (const event of progress) {
    expect(event).not.toHaveProperty("computeCostSummary")
  }
})
