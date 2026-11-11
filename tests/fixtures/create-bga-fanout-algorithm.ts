import { FixedTargetBgaFanoutSolver } from "@tscircuit/bga-fanout-solver"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

export const createBgaFanoutAlgorithm = createBasicAutorouter(async (input) => {
  if (input.differentialPairs?.length)
    throw new Error("Differential pairs do not support BGA fanout")
  const solver = new FixedTargetBgaFanoutSolver({
    ...input,
    differentialPairs: undefined,
  })
  solver.solve()
  if (solver.failed || !solver.solved) {
    throw new Error(solver.error ?? "Fixed-target BGA fanout failed")
  }
  return solver.getOutput().traces
})
