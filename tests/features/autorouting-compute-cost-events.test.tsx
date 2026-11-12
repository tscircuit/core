import { expect, test } from "bun:test"
import { computeCostSummary } from "tests/fixtures/create-compute-cost-autorouter"
import { renderStubComputeCostBoard } from "tests/fixtures/render-compute-cost-board"

test("routing progress and completion carry computeCostSummary", async () => {
  const { circuit, progress, ends } = await renderStubComputeCostBoard({
    emitProgress: true,
  })
  expect(progress.map((event) => event.computeCostSummary)).toEqual([
    computeCostSummary,
  ])
  expect(ends.map((event) => event.computeCostSummary)).toEqual([
    computeCostSummary,
  ])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
})
