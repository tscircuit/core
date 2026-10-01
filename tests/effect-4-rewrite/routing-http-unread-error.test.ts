import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { originalCoreError } from "lib/effect/core-error"
import { createRoutingJob } from "./routing-fixture"
import {
  createHttpRoutingFixture,
  provideRoutingServices,
} from "./routing-http-fixture"

test("a response consumer failure preserves its error and releases an unread body", async () => {
  const { circuit, board } = createHttpRoutingFixture()
  const job = createRoutingJob()
  const error = new SyntaxError("controlled response consumer failure")
  let cancellations = 0
  class FailingResponse extends Response {
    override json(): Promise<never> {
      return Promise.reject(error)
    }
  }
  const response = new FailingResponse(
    new ReadableStream<Uint8Array>({
      cancel() {
        cancellations++
      },
    }),
  )
  const exit = await Effect.runPromiseExit(
    provideRoutingServices(board._runHttpAutoroutingEffect(job), {
      job,
      fetch: async () => response,
    }),
  )
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) expect(originalCoreError(exit.cause)).toBe(error)
  expect(cancellations).toBe(1)
  expect(board._asyncAutoroutingResult).toBeNull()
  await circuit.dispose()
})
