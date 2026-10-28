import type { RootCircuitEventName } from "lib/events"
import type { RenderPhase } from "./components/base-components/render-phases"

export interface IIsolatedCircuit {
  _hasRenderLifecycleListeners?: boolean
  hasEventListener?(event: RootCircuitEventName): boolean
  emit(event: RootCircuitEventName, ...args: any[]): void
  on(event: RootCircuitEventName, listener: (...args: any[]) => void): void
  isDoneRendering(): boolean
  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean
}
