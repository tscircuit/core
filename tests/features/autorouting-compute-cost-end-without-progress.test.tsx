import { expect, test } from "bun:test"
import { computeCostSummary } from "tests/fixtures/create-compute-cost-autorouter"
import { renderStubComputeCostBoard } from "tests/fixtures/render-compute-cost-board"

test("completion carries computeCostSummary even when no progress was emitted", async () => {
  const { circuit, progress, ends } = await renderStubComputeCostBoard({
    emitProgress: false,
  })
  expect(progress).toEqual([])
  expect(ends.map((event) => event.computeCostSummary)).toEqual([
    computeCostSummary,
  ])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
})
