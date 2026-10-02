import { FixedTargetBgaFanoutSolver } from "@tscircuit/bga-fanout-solver"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

export const createBgaFanoutAlgorithm = createBasicAutorouter(async (input) => {
  const solver = new FixedTargetBgaFanoutSolver(input)
  solver.solve()
  if (solver.failed || !solver.solved) {
    throw new Error(solver.error ?? "Fixed-target BGA fanout failed")
  }
  return solver.getOutput().traces
})
