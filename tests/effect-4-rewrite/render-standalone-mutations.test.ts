import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise, runCoreSync } from "lib/effect/core-error"
import { z } from "zod"
import { flushRenderJobs } from "./render-helpers"

const schema = z.object({ value: z.number().optional() })

class StandalonePrimitive extends PrimitiveComponent<typeof schema> {
  get config() {
    return { componentName: "StandaloneTest", zodProps: schema }
  }
}

test("standalone remove, prop update and reparent boundaries abort owned resources before late writes", async () => {
  for (const boundary of ["native", "sync"] as const) {
    for (const mutation of ["remove", "props", "reparent"] as const) {
      const parent = new StandalonePrimitive({})
      const otherParent = new StandalonePrimitive({})
      const child = new StandalonePrimitive({ value: 1 })
      parent.add(child)
      const owner = mutation === "props" ? child : new StandalonePrimitive({})
      if (owner !== child) child.add(owner)
      let release!: () => void
      const pending = new Promise<void>((resolve) => {
        release = resolve
      })
      const resource = {
        active: 0,
        cleanup: 0,
        writes: 0,
        signal: undefined as AbortSignal | undefined,
      }
      owner._currentRenderPhase = "SourceRender"
      owner._queueEffect("standalone-mutation", (job) =>
        Effect.gen(function* () {
          yield* Effect.acquireRelease(
            Effect.sync(() => resource.active++),
            () =>
              Effect.sync(() => {
                resource.active--
                resource.cleanup++
              }),
          )
          yield* corePromise((signal) => {
            resource.signal = signal
            return pending
          })
          yield* Effect.sync(() => job.commit(() => resource.writes++))
        }),
      )
      expect(resource.active).toBe(1)
      expect(owner.getPendingAsyncEffectNames()).toEqual([
        "standalone-mutation",
      ])
      if (mutation === "remove") {
        if (boundary === "native") runCoreSync(parent.removeEffect(child))
        else parent.remove(child)
        expect(child.shouldBeRemoved).toBe(true)
        expect(parent.childrenPendingRemoval).toEqual([child])
      } else if (mutation === "props") {
        if (boundary === "native")
          runCoreSync(child.setPropsEffect({ value: 2 }))
        else child.setProps({ value: 2 })
        expect(child.props.value).toBe(2)
      } else {
        if (boundary === "native") runCoreSync(otherParent.addEffect(child))
        else otherParent.add(child)
        expect(child.parent).toBe(otherParent)
        expect(parent.children).toContain(child)
      }
      await flushRenderJobs(owner)
      expect(resource.signal?.aborted).toBe(true)
      expect(resource.active).toBe(0)
      expect(resource.cleanup).toBe(1)
      expect(owner.getPendingAsyncEffectNames()).toEqual([])
      const runtime = Reflect.get(owner, "_standaloneEffectRuntime")
      expect(runtime).toBeInstanceOf(CircuitRuntime)
      if (!(runtime instanceof CircuitRuntime))
        throw new Error("Missing standalone runtime")
      expect(runtime.activeJobCount).toBe(0)
      release()
      for (let continuation = 0; continuation < 20; continuation++)
        await Promise.resolve()
      expect(resource.writes).toBe(0)
      expect(resource.cleanup).toBe(1)
      await runtime.dispose()
    }
  }
})
