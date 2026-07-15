import type { RenderPhase } from "lib/components/base-components/Renderable"
import type { RootCircuitEventName } from "lib/events"

export interface IIsolatedCircuit {
  schematicDisabled: boolean
  emit(event: RootCircuitEventName, ...args: any[]): void
  on(event: RootCircuitEventName, listener: (...args: any[]) => void): void
  isDoneRendering(): boolean
  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean
}
