import type { RenderPhase } from "lib/components/base-components/Renderable"
import type { RootCircuitEventName } from "lib/events"
import type { CircuitRuntime } from "./effect/circuit-runtime"

export interface IIsolatedCircuit {
  readonly effectRuntime?: CircuitRuntime
  _hasRenderLifecycleListeners?: boolean
  hasEventListener?(event: RootCircuitEventName): boolean
  emit(event: RootCircuitEventName, ...args: any[]): void
  on(event: RootCircuitEventName, listener: (...args: any[]) => void): void
  isDoneRendering(): boolean
  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean
}
