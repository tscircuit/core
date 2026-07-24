import {
  AssignableAutoroutingPipeline2,
  AssignableAutoroutingPipeline3,
  AutoroutingPipeline1_OriginalUnravel,
  AutoroutingPipelineSolver,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  AutoroutingPipelineSolver4,
  AutoroutingPipelineSolver5,
  AutoroutingPipelineSolver7_MultiGraph,
  AutoroutingPipelineSolver8,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"
import { CreateFdmEnclosureSolver } from "@tscircuit/create-fdm-enclosure"
import { DifferentialPairSolver } from "@tscircuit/length-matching-post-process"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { PackSolver2 } from "calculate-packing"

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
  CreateFdmEnclosureSolver,
  DifferentialPairSolver,
  SchematicTracePipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
