import { type CacheProvider } from "@tscircuit/capacity-autorouter"
import type { PlatformConfig } from "@tscircuit/props"

import { type SolverName } from "lib/solvers"

import type { SimpleRouteJson } from "./SimpleRouteJson"
import type { AutorouterVersion } from "./autorouter-version"

export interface SolverStartedDetails {
  solverName: SolverName
  solverParams: {
    input: SimpleRouteJson
    options: {
      capacityDepth?: number
      targetMinCapacity?: number
      cacheProvider: CacheProvider | null
      effort?: number
    }
  }
}

export interface AutorouterOptions {
  capacityDepth?: number
  targetMinCapacity?: number
  stepDelay?: number
  useAssignableSolver?: boolean
  useAutoJumperSolver?: boolean
  useLaserPrefabSolver?: boolean
  useTraceSimplificationSolver?: boolean
  autorouterVersion?: AutorouterVersion
  effort?: number
  platformConfig?: Pick<
    PlatformConfig,
    "localCacheEngine" | "useCloudAutorouter" | "autorouterThreads"
  >
  onSolverStarted?: (details: SolverStartedDetails) => void
}

export type AutorouterSolverName =
  | "AutoroutingPipelineSolver11_Simplification"
  | "AutoroutingPipeline1_OriginalUnravel"
  | "AutoroutingPipelineSolver3_HgPortPointPathing"
  | "AutoroutingPipelineSolver4"
  | "AutoroutingPipelineSolver5"
  | "AutoroutingPipelineSolver7_MultiGraph"
  | "AutoroutingPipelineSolver9_PreloadedTraceGraph"
  | "AutoroutingPipelineSolver9_Networked"
  | "AutoroutingPipelineSolver8"
  | "AssignableAutoroutingPipeline3"
  | "AssignableAutoroutingPipeline2"

export const getAutorouterSolverName = ({
  useAssignableSolver = false,
  useAutoJumperSolver = false,
  autorouterVersion,
  useLaserPrefabSolver = false,
  useTraceSimplificationSolver = false,
  platformConfig,
  effort,
}: Pick<
  AutorouterOptions,
  | "useAssignableSolver"
  | "useAutoJumperSolver"
  | "autorouterVersion"
  | "useLaserPrefabSolver"
  | "useTraceSimplificationSolver"
  | "platformConfig"
  | "effort"
>): AutorouterSolverName => {
  const pipeline9SolverName =
    platformConfig?.useCloudAutorouter && (effort === undefined || effort === 1)
      ? "AutoroutingPipelineSolver9_Networked"
      : "AutoroutingPipelineSolver9_PreloadedTraceGraph"

  if (useTraceSimplificationSolver) {
    return "AutoroutingPipelineSolver11_Simplification"
  }
  if (autorouterVersion === "beta_pipeline1") {
    return "AutoroutingPipeline1_OriginalUnravel"
  }
  if (autorouterVersion === "beta_pipeline3") {
    return "AutoroutingPipelineSolver3_HgPortPointPathing"
  }
  if (autorouterVersion === "beta_pipeline4") {
    return "AutoroutingPipelineSolver4"
  }
  if (autorouterVersion === "beta_pipeline5") {
    return "AutoroutingPipelineSolver5"
  }
  if (autorouterVersion === "beta_pipeline7") {
    return "AutoroutingPipelineSolver7_MultiGraph"
  }
  if (
    autorouterVersion === "beta_pipeline9" ||
    autorouterVersion === "latest"
  ) {
    return pipeline9SolverName
  }
  if (useLaserPrefabSolver) return "AutoroutingPipelineSolver8"
  if (useAutoJumperSolver) return "AssignableAutoroutingPipeline3"
  if (useAssignableSolver) return "AssignableAutoroutingPipeline2"
  return pipeline9SolverName
}
