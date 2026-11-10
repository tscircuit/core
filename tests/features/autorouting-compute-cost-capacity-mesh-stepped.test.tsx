import { expect, test } from "bun:test"
import { computeCostSummary } from "tests/fixtures/create-compute-cost-autorouter"
import { renderCapacityMeshComputeCostBoard } from "tests/fixtures/render-compute-cost-board"

test("capacity mesh forwards solver computeCostSummary on stepped progress", async () => {
  const { circuit, progress, autorouter } =
    await renderCapacityMeshComputeCostBoard({
      autorouterThreads: 1,
      measured: true,
    })
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autorouter.getComputeCostSummary()).toEqual(computeCostSummary)
  expect(progress.length).toBeGreaterThan(0)
  for (const event of progress) {
    expect(event.computeCostSummary).toEqual(computeCostSummary)
  }
})
