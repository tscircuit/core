import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { PreventSchedulerYield } from "effect/References"
import type { IsolatedCircuit } from "../../IsolatedCircuit"
import { coreErrorBrand, originalCoreError } from "../../effect/core-error"

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
  prepareRender: () => void
  prepareRenderEffect?: () => Effect.Effect<unknown, E>
  renderEffect?: () => Effect.Effect<unknown, E>
  hasUnrenderedUpdates: () => boolean
  shouldRenderAfterWait: () => boolean
}

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

function waitForRenderProgress(settlement: RenderSettlement<unknown>) {
  return Effect.callback<void>((resume) => {
    // callback's returned cleanup runs on interruption. Normal completion must
    // clean up here as well; Effect 4 ignores subsequent resumes.
    const onProgress = () => {
      clearTimeout(timer)
      settlement.circuit.removeListener("asyncEffect:end", onProgress)
      // The legacy Promise's await resumes after all end-event observers.
      // Effect callback resumes synchronously, so preserve that microtask edge.
      queueMicrotask(() => resume(Effect.void))
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
      yield* settlement.prepareRenderEffect?.() ??
        tryRenderSettlement(settlement.prepareRender)
      yield* settlement.renderEffect?.() ??
        tryRenderSettlement(() => settlement.circuit.render())

      while (
        !(yield* tryRenderSettlement(() =>
          settlement.circuit.isDoneRendering(),
        ))
      ) {
        yield* waitForRenderProgress(settlement)
        // Keep idle polls from traversing the component tree.
        if (settlement.shouldRenderAfterWait()) {
          yield* settlement.renderEffect?.() ??
            tryRenderSettlement(() => settlement.circuit.render())
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

export function runRenderUntilSettled<E = never>(
  settlement: RenderSettlement<E>,
  options: RenderUntilSettledOptions,
): Promise<void> {
  // Resolve the Promise directly from Exit to retain the original settlement
  // timing and thrown object, without an extra async function continuation.
  return new Promise<void>((resolve, reject) => {
    // Run options attach interruption after synchronous startup. Check first.
    if (options.signal?.aborted) {
      reject(options.signal.reason)
      return
    }
    Effect.runCallback(renderUntilSettledEffect(settlement), {
      signal: options.signal,
      onExit: (exit) => {
        if (Exit.isSuccess(exit)) {
          resolve()
        } else if (
          Cause.hasInterruptsOnly(exit.cause) &&
          options.signal?.aborted
        ) {
          reject(options.signal.reason)
        } else {
          reject(originalCoreError(exit.cause))
        }
      },
    })
  })
}
