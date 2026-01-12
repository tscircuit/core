import { PackSolver2 } from "calculate-packing"
import {
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  AutoroutingPipeline1_OriginalUnravel,
  AssignableAutoroutingPipeline3,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"

export const SOLVERS = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  AssignableAutoroutingPipeline3,
  AutoroutingPipeline1_OriginalUnravel,
  CopperPourPipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
