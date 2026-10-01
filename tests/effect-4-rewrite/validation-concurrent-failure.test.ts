import { expect, test } from "bun:test"
import { source_runtime_error } from "circuit-json"
import * as Effect from "effect/Effect"
import { runDesignRuleCheckGroups } from "lib/effect/design-rule-checks"

test("Effect DRC groups run concurrently and retain ordered successes across synchronous failures", async () => {
  const firstGate = Promise.withResolvers<void>()
  const lastGate = Promise.withResolvers<void>()
  const entered: string[] = []
  const failures: unknown[] = []
  const first = source_runtime_error.parse({
    source_runtime_error_id: "first",
    type: "source_runtime_error",
    error_type: "source_runtime_error",
    phase_name: "PcbDesignRuleChecks",
    message: "first diagnostic",
  })
  const last = source_runtime_error.parse({
    source_runtime_error_id: "last",
    type: "source_runtime_error",
    error_type: "source_runtime_error",
    phase_name: "PcbDesignRuleChecks",
    message: "last diagnostic",
  })
  const error = new Error("broken checker")
  const result = Effect.runPromise(
    runDesignRuleCheckGroups({
      groups: [
        {
          name: "first",
          check: async () => {
            entered.push("first")
            await firstGate.promise
            return [first]
          },
        },
        {
          name: "broken",
          check: () => {
            entered.push("broken")
            throw error
          },
        },
        {
          name: "last",
          check: async () => {
            entered.push("last")
            await lastGate.promise
            return [last]
          },
        },
      ],
      onFailure: (_group, cause) => {
        failures.push(cause)
      },
    }),
  )
  await Promise.resolve()
  expect(entered).toEqual(["first", "broken", "last"])
  lastGate.resolve()
  firstGate.resolve()
  expect(await result).toEqual([first, last])
  expect(failures).toEqual([error])
})
