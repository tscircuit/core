import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"
import { z } from "zod"

const propsSchema = z.object({ value: z.number().optional() })
class PolicyProbe extends PrimitiveComponent<typeof propsSchema> {
  get config() {
    return { componentName: "PolicyProbe", zodProps: propsSchema }
  }
}

test("cancellation keeps native abort reasons, original synchronous policy failures, and owned cleanup", async () => {
  const owner = new PolicyProbe({ value: 1 })
  const primaryFailure = new Error("restart guard failed")
  let jobSignal!: AbortSignal
  let cleanupCount = 0
  owner._currentRenderPhase = "SourceRender"
  owner._queueEffect(
    "policy-probe",
    (job) =>
      Effect.gen(function* () {
        jobSignal = job.signal
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            cleanupCount++
          }),
        )
        yield* corePromise(() => new Promise<void>(() => {}))
      }),
    {
      onCancel(reason) {
        expect(reason).toBe("props_changed")
        expect(jobSignal.aborted).toBe(true)
        expect(jobSignal.reason).toBeInstanceOf(DOMException)
        expect(jobSignal.reason.name).toBe("AbortError")
        throw primaryFailure
      },
    },
  )
  let observed: unknown
  try {
    owner.setProps({ value: 2 })
  } catch (failure) {
    observed = failure
  }
  expect(observed).toBe(primaryFailure)
  expect(owner.props.value).toBe(1)
  const runtime = Reflect.get(owner, "_standaloneEffectRuntime")
  expect(runtime).toBeInstanceOf(CircuitRuntime)
  if (!(runtime instanceof CircuitRuntime))
    throw new Error("Expected existing standalone runtime")
  await runtime.dispose()
  expect(cleanupCount).toBe(1)
  expect(runtime.activeJobCount).toBe(0)
})
