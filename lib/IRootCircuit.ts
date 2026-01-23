import type { RootCircuitEventName } from "lib/events"
import type { RenderPhase } from "lib/components/base-components/Renderable"

export interface IRootCircuit {
  emit(event: RootCircuitEventName, ...args: any[]): void
  on(event: RootCircuitEventName, listener: (...args: any[]) => void): void
  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean
}
