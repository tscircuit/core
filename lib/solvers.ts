import { PackSolver2 } from "calculate-packing"
import {
  AutoroutingPipelineSolver,
  AssignableViaAutoroutingPipelineSolver,
} from "@tscircuit/capacity-autorouter"

export const SOLVERS = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableViaAutoroutingPipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
