import * as Effect from "effect/Effect"
import {
  type IRenderable,
  type RenderPhaseFunctions,
  type RenderPhaseStates,
  Renderable,
} from "../components/base-components/Renderable"
import { type CoreError, atomicCoreEffect, coreSync } from "./core-error"
import {
  type RenderPhase,
  asyncPhaseDependencies,
  orderedRenderPhases,
  renderPhaseIndexMap,
} from "./render-phase-definitions"

export interface RenderPhaseContext {
  readonly renderable: Renderable
  readonly phase: RenderPhase
  getState(): RenderPhaseStates[RenderPhase]
  hasPreviousPhaseJobs(): boolean
  cancelRemovedJobs(): void
  emitLifecycle(startOrEnd: "start" | "end"): void
}

/**
 * A render transaction keeps the original synchronous call-stack boundary.
 * Interruption is deferred through hook/state/event transitions, and Effect's
 * cooperative operation budget cannot expose a partially completed cycle.
 * Awaited work belongs to separately owned jobs, outside this boundary.
 */
export function atomicRenderEffect<A, E, R>(program: Effect.Effect<A, E, R>) {
  return atomicCoreEffect(program)
}

/**
 * A phase is a sequential Effect program: enter, gate, invoke a domain hook,
 * transition the captured state, then publish completion. Hooks remain
 * synchronous adapters so existing subclasses keep their extension contract.
 */
export function renderPhaseEffect(context: RenderPhaseContext) {
  return atomicRenderEffect(
    Effect.flatMap(
      coreSync(() => prepareRenderPhase(context), `prepare_${context.phase}`),
      (transition) =>
        transition.action === "complete"
          ? Effect.void
          : renderPhaseTransitionEffect(context, transition),
    ),
  )
}

type RenderPhaseTransition = {
  action: "initial" | "update" | "remove"
  state: RenderPhaseStates[RenderPhase]
}

const completedRenderPhase = { action: "complete" } as const

/**
 * The synchronous decision prefix preserves read, gate and event order without
 * allocating a generator or individual Effect steps for completed clean phases.
 */
function prepareRenderPhase(
  context: RenderPhaseContext,
): RenderPhaseTransition | typeof completedRenderPhase {
  const { renderable, phase } = context
  renderable._currentRenderPhase = phase
  const state = context.getState()
  const { initialized, dirty } = state
  if (renderable.shouldBeRemoved) {
    context.cancelRemovedJobs()
    return initialized ? { action: "remove", state } : completedRenderPhase
  }
  if (context.hasPreviousPhaseJobs()) return completedRenderPhase
  for (const dependency of asyncPhaseDependencies[phase] ?? []) {
    if (renderable._hasIncompleteAsyncEffectsForPhase(dependency))
      return completedRenderPhase
  }
  if (initialized && !dirty) {
    context.emitLifecycle("start")
    context.emitLifecycle("end")
    return completedRenderPhase
  }
  return { action: initialized ? "update" : "initial", state }
}

function renderPhaseTransitionEffect(
  context: RenderPhaseContext,
  transition: RenderPhaseTransition,
) {
  return Effect.gen(function* () {
    const { renderable, phase } = context
    const { action, state } = transition
    yield* coreSync(() => context.emitLifecycle("start"), `start_${phase}`)
    if (action === "initial") {
      yield* coreSync(() => {
        state.dirty = false
      }, `initial_state_${phase}`)
      yield* invokePhaseHookEffect({ renderable, method: `doInitial${phase}` })
      yield* coreSync(() => {
        state.initialized = true
      }, `initialized_state_${phase}`)
    } else if (action === "update") {
      yield* invokePhaseHookEffect({ renderable, method: `update${phase}` })
      yield* coreSync(() => {
        state.dirty = false
      }, `update_state_${phase}`)
    } else {
      yield* invokePhaseHookEffect({ renderable, method: `remove${phase}` })
      yield* coreSync(() => {
        state.initialized = false
        state.dirty = false
      }, `remove_state_${phase}`)
    }
    yield* coreSync(() => context.emitLifecycle("end"), `end_${phase}`)
  })
}

function invokePhaseHookEffect(context: {
  renderable: Renderable
  method: keyof RenderPhaseFunctions
}) {
  return coreSync(() => {
    const hook = (context.renderable as RenderPhaseFunctions)[context.method]
    hook?.call(context.renderable)
  }, context.method)
}

/** Sequential iteration retains live array semantics when a hook adds children. */
export function renderChildrenEffect(context: {
  renderable: Renderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return atomicRenderEffect(
    Effect.suspend(() => {
      const { renderable, phase } = context
      return Effect.forEach(
        renderable.children,
        (child) =>
          Effect.suspend(() => {
            if (
              phase === "RenderIsolatedSubcircuits" &&
              "_isIsolatedSubcircuit" in renderable &&
              renderable._isIsolatedSubcircuit &&
              "doInitialRenderIsolatedSubcircuits" in renderable
            )
              return Effect.void
            return Effect.andThen(
              dispatchRenderChildrenEffect({ renderable: child, phase }),
              dispatchRenderPhaseEffect({ renderable: child, phase }),
            )
          }),
        { discard: true },
      )
    }),
  )
}

export function renderCycleEffect(
  renderable: Renderable,
): Effect.Effect<void, CoreError> {
  return atomicRenderEffect(
    Effect.forEach(
      orderedRenderPhases,
      (phase) =>
        Effect.andThen(
          dispatchRenderChildrenEffect({ renderable, phase }),
          dispatchRenderPhaseEffect({ renderable, phase }),
        ),
      { discard: true },
    ),
  )
}

/**
 * A native hook wins when provided. Otherwise preserve a subclass's existing
 * synchronous override instead of bypassing it during Effect traversal.
 */
export function dispatchRenderPhaseEffect(context: {
  renderable: IRenderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return Effect.suspend(() => {
    const { renderable, phase } = context
    if (
      renderable instanceof Renderable &&
      shouldUseNativeRenderMethod({
        renderable,
        synchronousMethod: "runRenderPhase",
        effectMethod: "runRenderPhaseEffect",
      })
    ) {
      return renderable.runRenderPhaseEffect(phase)
    }
    return coreSync(
      () => renderable.runRenderPhase(phase),
      `custom_phase_${phase}`,
    )
  })
}

export function dispatchRenderChildrenEffect(context: {
  renderable: IRenderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return Effect.suspend(() => {
    const { renderable, phase } = context
    if (
      renderable instanceof Renderable &&
      shouldUseNativeRenderMethod({
        renderable,
        synchronousMethod: "runRenderPhaseForChildren",
        effectMethod: "runRenderPhaseForChildrenEffect",
      })
    ) {
      return renderable.runRenderPhaseForChildrenEffect(phase)
    }
    return coreSync(
      () => renderable.runRenderPhaseForChildren(phase),
      `custom_children_${phase}`,
    )
  })
}

export function markRenderPhasesDirtyEffect(context: {
  renderable: Renderable
  phase: RenderPhase
  getState(phase: RenderPhase): RenderPhaseStates[RenderPhase]
}): Effect.Effect<void, CoreError> {
  return atomicRenderEffect(
    Effect.gen(function* () {
      const { renderable, phase } = context
      const phaseIndex = renderPhaseIndexMap.get(phase)
      yield* Effect.forEach(
        phaseIndex === undefined ? [] : orderedRenderPhases.slice(phaseIndex),
        (dirtyPhase) =>
          coreSync(() => {
            context.getState(dirtyPhase).dirty = true
          }, `dirty_${dirtyPhase}`),
        { discard: true },
      )
      const { parent } = renderable
      if (!parent?._markDirty) return
      if (
        parent instanceof Renderable &&
        shouldUseNativeRenderMethod({
          renderable: parent,
          synchronousMethod: "_markDirty",
          effectMethod: "_markDirtyEffect",
        })
      ) {
        yield* parent._markDirtyEffect(phase)
      } else {
        yield* coreSync(() => parent._markDirty(phase), `custom_dirty_${phase}`)
      }
    }),
  )
}

/** A nearer legacy override must not be hidden by an inherited native hook. */
function shouldUseNativeRenderMethod(context: {
  renderable: Renderable
  synchronousMethod:
    | "runRenderPhase"
    | "runRenderPhaseForChildren"
    | "_markDirty"
  effectMethod:
    | "runRenderPhaseEffect"
    | "runRenderPhaseForChildrenEffect"
    | "_markDirtyEffect"
}) {
  const { renderable, synchronousMethod, effectMethod } = context
  for (
    let methodOwner: object | null = renderable;
    methodOwner;
    methodOwner = Reflect.getPrototypeOf(methodOwner)
  ) {
    if (Object.hasOwn(methodOwner, effectMethod)) return true
    if (Object.hasOwn(methodOwner, synchronousMethod)) return false
  }
  return false
}
