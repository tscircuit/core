import { PackSolver2 } from "calculate-packing"
import {
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"

export const SOLVERS = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  CopperPourPipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
