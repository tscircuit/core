import { PackSolver2 } from "calculate-packing"
import {
  AutoroutingPipelineSolver,
  AssignableViaAutoroutingPipelineSolver,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"

export const SOLVERS = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableViaAutoroutingPipelineSolver,
  CopperPourPipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
