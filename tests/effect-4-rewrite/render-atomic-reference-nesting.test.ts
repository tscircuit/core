import { expect, test } from "bun:test"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { PreventSchedulerYield } from "effect/References"
import { atomicRenderEffect } from "lib/effect/render-phase-programs"

const CallerReference = Context.Reference("test/atomic-render-caller", {
  defaultValue: () => "default",
})

test("nested atomic render scopes reuse an already protected context and preserve caller references", () => {
  const observed = Effect.runSync(
    Effect.provideService(
      Effect.withFiber((caller) => {
        const callerContext = caller.context
        return atomicRenderEffect(
          Effect.withFiber((outer) => {
            const outerContext = outer.context
            return atomicRenderEffect(
              Effect.withFiber((inner) =>
                Effect.succeed({
                  contextReused:
                    inner.context === outerContext &&
                    outerContext === callerContext,
                  protected: inner.getRef(PreventSchedulerYield),
                  callerReference: inner.getRef(CallerReference),
                }),
              ),
            )
          }),
        )
      }),
      CallerReference,
      "caller",
    ).pipe(Effect.provideService(PreventSchedulerYield, true)),
  )
  expect(observed).toEqual({
    contextReused: true,
    protected: true,
    callerReference: "caller",
  })
})
