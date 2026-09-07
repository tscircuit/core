import type { RenderPhase } from "lib/components/base-components/Renderable"
import type { SOLVERS } from "lib/solvers"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export type RootCircuitEventName =
  | "asyncEffect:start"
  | "asyncEffect:end"
  | "renderable:renderLifecycle:anyEvent"
  | `renderable:renderLifecycle:${RenderPhase}:start`
  | `renderable:renderLifecycle:${RenderPhase}:end`
  | `board:renderPhaseStarted`
  | "external:evalError" // TODO remove
  | "autorouting:start"
  | "autorouting:end"
  | "autorouting:error"
  | "autorouting:progress"
  | "packing:start"
  | "packing:end"
  | "packing:error"
  | "solver:started"
  | "solver:ended"
  | "renderComplete"
  | "debug:logOutput"

export type AutoroutingCacheStatus = "disabled" | "hit" | "miss"

export type AutoroutingCacheDisabledReason =
  | "custom_algorithm"
  | "strategy_not_cacheable"
  | "no_cache_engine"

export interface AutoroutingExecutionMetadata {
  routingPhaseIndex?: number | null
  phaseOrdinal?: number
  phaseCount?: number
  connectionCount?: number
  obstacleCount?: number
  previousTraceCount?: number
  isReroutePhase?: boolean
  autorouterName?: string
  autorouterVersion?: string
  solverName?: string
  effort?: number
  cacheStatus?: AutoroutingCacheStatus
  cacheKey?: string
  cacheDisabledReason?: AutoroutingCacheDisabledReason
}

export interface AutoroutingStartEvent extends AutoroutingExecutionMetadata {
  type: "autorouting:start"
  subcircuit_id: string
  componentDisplayName: string
  phaseName?: string
  phaseStageIndex?: number
  phaseStageCount?: number
  simpleRouteJson: SimpleRouteJson
}

export interface AutoroutingErrorEvent extends AutoroutingExecutionMetadata {
  type: "autorouting:error"
  subcircuit_id: string
  componentDisplayName: string
  phaseName?: string
  phaseStageIndex?: number
  phaseStageCount?: number
  error?: { message: string; stack?: string }
  simpleRouteJson?: SimpleRouteJson
  debugGraphics?: any
}

export interface AutoroutingProgressEvent extends AutoroutingExecutionMetadata {
  type: "autorouting:progress"
  subcircuit_id: string
  componentDisplayName: string
  phaseName?: string
  phaseStageIndex?: number
  phaseStageCount?: number
  progress: number
  iterationsPerSecond?: number
  debugGraphics?: any
}

export interface AutoroutingEndEvent extends AutoroutingExecutionMetadata {
  type: "autorouting:end"
  subcircuit_id: string
  componentDisplayName: string
  phaseName?: string
  phaseStageIndex?: number
  phaseStageCount?: number
  simpleRouteJson: SimpleRouteJson
}

export interface PackingStartEvent {
  type: "packing:start"
  subcircuit_id: string | null
  componentDisplayName: string
}

export interface PackingEndEvent {
  type: "packing:end"
  subcircuit_id: string | null
  componentDisplayName: string
}

export interface PackingErrorEvent {
  type: "packing:error"
  subcircuit_id: string | null
  componentDisplayName: string
  error?: { message: string }
}

export interface SolverStartedEvent {
  type: "solver:started"
  solverName: keyof typeof SOLVERS
  solverParams: any
  /** Full constructor tuple for deterministic solver reproduction. */
  solverConstructorArgs: readonly unknown[]
  componentName: string
}

export interface SolverEndedEvent {
  type: "solver:ended"
  solverName: keyof typeof SOLVERS
  componentName: string
  solved: boolean
  failed: boolean
  iterations: number
  error: string | null
}

export interface DebugLogOutputEvent {
  type: "debug:logOutput"
  name: string
  content: any
}
