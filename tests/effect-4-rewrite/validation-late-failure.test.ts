import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { runDesignRuleCheckGroups } from "lib/effect/design-rule-checks"
import type { AnyCircuitElement } from "circuit-json"

test("interrupted noncooperative checks cannot emit a late failure diagnostic", async () => {
  const transport = Promise.withResolvers<AnyCircuitElement[]>()
  const entered = Promise.withResolvers<void>()
  const controller = new AbortController()
  const failures: unknown[] = []
  const consumer = Effect.runPromiseExit(
    runDesignRuleCheckGroups({
      groups: [
        {
          name: "external",
          check: () => {
            entered.resolve()
            return transport.promise
          },
        },
      ],
      onFailure: (_group, cause) => {
        failures.push(cause)
      },
    }),
    { signal: controller.signal },
  )
  await entered.promise
  controller.abort()
  expect(Exit.isFailure(await consumer)).toBe(true)
  transport.reject(new Error("late checker error"))
  await Promise.resolve()
  await Promise.resolve()
  expect(failures).toEqual([])
})
