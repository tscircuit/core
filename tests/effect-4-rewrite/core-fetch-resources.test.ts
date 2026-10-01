import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { Renderable } from "lib/components/base-components/Renderable"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { coreFetch } from "lib/effect/core-services"

class FetchOwner extends Renderable {}

test("fetch scopes close unread errors and late responses after interrupted acquisition", async () => {
  let canceled = 0
  const response = () =>
    new Response(
      new ReadableStream({
        cancel: () => {
          canceled++
        },
      }),
    )
  const original = new Error("request failed before decoding")
  const runtime = new CircuitRuntime(() => ({ fetch: async () => response() }))
  const failure = await runtime
    .queue({
      owner: new FetchOwner({}),
      build: () =>
        Effect.gen(function* () {
          yield* coreFetch("https://resource.test")
          yield* Effect.fail(original)
        }),
    })
    .catch((error: unknown) => error)
  expect(failure).toBe(original)
  expect(canceled).toBe(1)
  await runtime.dispose()

  let release!: (body: Response) => void
  const pending = new Promise<Response>((resolve) => {
    release = resolve
  })
  const lateRuntime = new CircuitRuntime(() => ({ fetch: () => pending }))
  let writes = 0
  const completion = lateRuntime.queue({
    owner: new FetchOwner({}),
    build: (job) =>
      Effect.gen(function* () {
        yield* coreFetch("https://late-resource.test")
        job.commit(() => {
          writes++
        })
      }),
  })
  await lateRuntime.dispose()
  await completion
  release(response())
  for (let turn = 0; turn < 20; turn++) await Promise.resolve()
  expect(canceled).toBe(2)
  expect(writes).toBe(0)
  expect(lateRuntime.activeJobCount).toBe(0)
})
