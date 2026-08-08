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
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"
import { CreateFdmEnclosureSolver } from "@tscircuit/create-fdm-enclosure"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { PackSolver2 } from "calculate-packing"

export const SOLVERS = {
  PackSolver2,
  LayoutPipelineSolver,
  AutoroutingPipelineSolver,
  AssignableAutoroutingPipeline2,
  AssignableAutoroutingPipeline3,
  AutoroutingPipeline1_OriginalUnravel,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  AutoroutingPipelineSolver4,
  AutoroutingPipelineSolver5,
  AutoroutingPipelineSolver7_MultiGraph,
  AutoroutingPipelineSolver8,
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  CopperPourPipelineSolver,
  CreateFdmEnclosureSolver,
  SchematicTracePipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
