import { PackSolver2 } from "calculate-packing"
import {
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  AutoroutingPipeline1_OriginalUnravel,
  AssignableAutoroutingPipeline3,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  AutoroutingPipelineSolver4,
  AutoroutingPipelineSolver5,
  AutoroutingPipelineSolver7_MultiGraph,
  AutoroutingPipelineSolver8,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"

export const SOLVERS = {
  PackSolver2,
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  AssignableAutoroutingPipeline3,
  AutoroutingPipeline1_OriginalUnravel,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  AutoroutingPipelineSolver4,
  AutoroutingPipelineSolver5,
  AutoroutingPipelineSolver7_MultiGraph,
  AutoroutingPipelineSolver8,
  CopperPourPipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
