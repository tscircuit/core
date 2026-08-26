import { FixedTargetBgaFanoutSolver } from "@tscircuit/bga-fanout-solver"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

export const createBgaFanoutAlgorithm = createBasicAutorouter(async (input) => {
  const solver = new FixedTargetBgaFanoutSolver(input)
  solver.solve()
  return solver.getOutput().traces
})
