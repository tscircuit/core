import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise } from "lib/effect/core-error"

class RuntimeOwner extends Renderable {}

test("captured ancestry guards direct reparenting and cancels already detached descendants", async () => {
  const runtime = new CircuitRuntime(() => ({ fetch }))
  const ancestor = new RuntimeOwner({})
  const replacement = new RuntimeOwner({})
  const owner = new RuntimeOwner({})
  owner.parent = ancestor
  let release!: () => void
  let writes = 0
  let signal!: AbortSignal
  let isCurrent!: () => boolean
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  const completion = runtime.queue({
    owner,
    build: (job) =>
      Effect.gen(function* () {
        signal = job.signal
        isCurrent = job.isCurrent
        yield* corePromise(() => pending)
        job.commit(() => {
          writes++
        })
      }),
  })
  ancestor.parent = replacement
  expect(isCurrent()).toBe(false)
  owner.parent = null
  runtime.cancelSubtree(ancestor)
  expect(signal.aborted).toBe(true)
  await completion
  release()
  for (let turn = 0; turn < 20; turn++) await Promise.resolve()
  expect(writes).toBe(0)
  expect(runtime.activeJobCount).toBe(0)
  await runtime.dispose()
})
