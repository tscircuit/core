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
  AutoroutingPipelineSolver10_BgaFanout,
  AutoroutingPipelineSolver11_Simplification,
} from "@tscircuit/capacity-autorouter"
import { CopperPourPipelineSolver } from "@tscircuit/copper-pour-solver"
import { CreateFdmEnclosureSolver } from "@tscircuit/create-fdm-enclosure"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import { ImplicitCopperPourPipelineSolver } from "@tscircuit/implicit-copper-pour-solver/lib/index"
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
  AutoroutingPipelineSolver10_BgaFanout,
  AutoroutingPipelineSolver11_Simplification,
  CopperPourPipelineSolver,
  CreateFdmEnclosureSolver,
  FanoutSolver,
  ImplicitCopperPourPipelineSolver,
  SchematicTracePipelineSolver,
}

export type SolverName = keyof typeof SOLVERS
