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
  | "renderComplete"
  | "debug:logOutput"

export interface AutoroutingStartEvent {
  type: "autorouting:start"
  subcircuit_id: string
  componentDisplayName: string
  simpleRouteJson: SimpleRouteJson
}

export interface AutoroutingErrorEvent {
  type: "autorouting:error"
  subcircuit_id: string
  componentDisplayName: string
  error?: { message: string; stack?: string }
  simpleRouteJson?: SimpleRouteJson
  debugGraphics?: any
}

export interface AutoroutingProgressEvent {
  type: "autorouting:progress"
  subcircuit_id: string
  componentDisplayName: string
  progress: number
  iterationsPerSecond?: number
  debugGraphics?: any
}

export interface AutoroutingEndEvent {
  type: "autorouting:end"
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
  componentName: string
}

export interface DebugLogOutputEvent {
  type: "debug:logOutput"
  name: string
  content: any
}
