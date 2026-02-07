import type { RenderPhase } from "lib/components/base-components/Renderable"
import type { RootCircuitEventName } from "lib/events"

export interface IIsolatedCircuit {
  emit(event: RootCircuitEventName, ...args: any[]): void
  on(event: RootCircuitEventName, listener: (...args: any[]) => void): void
  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean
}
