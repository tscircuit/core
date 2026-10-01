import * as Effect from "effect/Effect"
import { PreventSchedulerYield } from "effect/References"
import type { IsolatedCircuit } from "../../IsolatedCircuit"
import { coreErrorBrand } from "../../effect/core-error"

export interface RenderUntilSettledOptions {
  /**
   * Experimental: interrupt this caller's wait and release its listener/timer.
   * Already-started component jobs continue; this does not cancel the circuit.
   */
  signal?: AbortSignal
}

type RenderSettlement<E = never> = {
  circuit: Pick<
    IsolatedCircuit,
    "render" | "isDoneRendering" | "on" | "removeListener" | "emit"
  >
  hasUnrenderedUpdates: () => boolean
  shouldRenderAfterWait: () => boolean
} & (
  | {
      prepareRenderEffect: () => Effect.Effect<unknown, E>
      renderEffect: () => Effect.Effect<unknown, E>
    }
  | { prepareRender: () => void }
)

/** Internal typed failure; the Promise boundary rethrows the original cause. */
export class RenderSettlementError extends Error {
  readonly _tag = "render_settlement_error"
  readonly [coreErrorBrand] = true

  constructor(cause: unknown) {
    super("Render settlement failed", { cause })
  }
}

function tryRenderSettlement<A>(step: () => A) {
  return Effect.try({
    try: step,
    catch: (cause) => new RenderSettlementError(cause),
  })
}

/**
 * Preserve the legacy await boundary after all asyncEffect:end observers.
 * Pinned by revision/settlement-end-observer-order.test.tsx.
 */
function resumeAfterAsyncEffectEndObservers(resume: () => void) {
  queueMicrotask(resume)
}

function waitForRenderProgress(settlement: RenderSettlement<unknown>) {
  return Effect.callback<void>((resume) => {
    // callback's returned cleanup runs on interruption. Normal completion must
    // clean up here as well; Effect 4 ignores subsequent resumes.
    const onProgress = () => {
      clearTimeout(timer)
      settlement.circuit.removeListener("asyncEffect:end", onProgress)
      resumeAfterAsyncEffectEndObservers(() => resume(Effect.void))
    }
    const timer = setTimeout(onProgress, 100)
    settlement.circuit.on("asyncEffect:end", onProgress)
    // Preserve the completion-before-subscription race check.
    if (settlement.hasUnrenderedUpdates()) onProgress()

    return Effect.sync(() => {
      clearTimeout(timer)
      settlement.circuit.removeListener("asyncEffect:end", onProgress)
    })
  })
}

/** Owns the settlement wait, not the eagerly-started component Promises. */
export function renderUntilSettledEffect<E = never>(
  settlement: RenderSettlement<E>,
) {
  return Effect.provideService(
    Effect.gen(function* () {
      // Direct utility consumers retain their synchronous input shape. Adapt
      // that boundary once; the circuit method supplies only native factories.
      const programs =
        "prepareRenderEffect" in settlement
          ? settlement
          : {
              prepareRenderEffect: () =>
                tryRenderSettlement(settlement.prepareRender),
              renderEffect: () =>
                tryRenderSettlement(() => settlement.circuit.render()),
            }
      yield* programs.prepareRenderEffect()
      yield* programs.renderEffect()

      while (
        !(yield* tryRenderSettlement(() =>
          settlement.circuit.isDoneRendering(),
        ))
      ) {
        yield* waitForRenderProgress(settlement)
        // Keep idle polls from traversing the component tree.
        if (settlement.shouldRenderAfterWait()) {
          yield* programs.renderEffect()
        }
      }

      yield* tryRenderSettlement(() =>
        settlement.circuit.emit("renderComplete"),
      )
    }),
    PreventSchedulerYield,
    true,
  )
}
