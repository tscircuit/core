import { DogboneViaSizePrecheckBoard } from "tests/fixtures/dogbone-via-size-precheck-board"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("oversized dogbone vias stop routing before a solver starts", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  const started: unknown[] = []
  circuit.on("solver:started", (event) => {
    if (
      event.solverName !== "LayoutPipelineSolver" &&
      event.solverName !== "PackSolver2"
    )
      started.push(event)
  })
  circuit.on("autorouting:start", (event) => started.push(event))
  circuit.add(<DogboneViaSizePrecheckBoard />)
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_autorouting_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("does not allow dogboning U1.")
  expect(errors[0].message).toContain("0.319mm")
  expect(started).toEqual([])
  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
