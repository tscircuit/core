import {
  type RenderPhase,
  type RenderPhaseStates,
  Renderable,
} from "lib/components/base-components/Renderable"

export class PhaseLifecycleProbe extends Renderable {
  readonly events: string[] = []
  onLifecycle?: (event: "start" | "end") => void

  protected override _emitRenderLifecycleEvent(
    _phase: RenderPhase,
    event: "start" | "end",
  ) {
    this.events.push(event)
    this.onLifecycle?.(event)
  }
}

export function observePhaseState(
  probe: PhaseLifecycleProbe,
  phase: RenderPhase,
  initialState: RenderPhaseStates[RenderPhase],
) {
  const state = { ...initialState }
  probe.renderPhaseStates[phase] = {
    get initialized() {
      return state.initialized
    },
    set initialized(initialized) {
      probe.events.push(`initialized:${initialized}`)
      state.initialized = initialized
    },
    get dirty() {
      return state.dirty
    },
    set dirty(dirty) {
      probe.events.push(`dirty:${dirty}`)
      state.dirty = dirty
    },
  }
  return state
}

export function observePhaseHook(
  probe: PhaseLifecycleProbe,
  phase: RenderPhase,
  action: "initial" | "update" | "remove",
  callbacks: { onRead?: () => void; onHook?: () => void } = {},
) {
  const prefix = action === "initial" ? "doInitial" : action
  Object.defineProperty(probe, `${prefix}${phase}`, {
    get: () => {
      probe.events.push("hook_lookup")
      callbacks.onRead?.()
      return () => {
        probe.events.push("hook")
        callbacks.onHook?.()
      }
    },
  })
}
