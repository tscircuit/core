import { expect, test } from "bun:test"
import { balanceTestPlans } from "../../scripts/lib/balance-test-plans"

test("balances test runtimes deterministically and includes unmeasured files", () => {
  const durations = { slow: 100, medium: 60, fast: 40, tiny: 10 }
  const files = Object.keys(durations)
  const plans = balanceTestPlans(files, 2, durations)
  expect(plans.map((plan) => plan.durationMs)).toEqual([110, 100])
  expect(plans.flatMap((plan) => plan.files).sort()).toEqual(files.sort())
  expect(balanceTestPlans([...files].reverse(), 2, durations)).toEqual(plans)

  const unmeasured = balanceTestPlans(["new", "invalid", "zero"], 2, {
    recorded: 20,
    invalid: -1,
    zero: 0,
  })
  expect(unmeasured.map((plan) => plan.durationMs)).toEqual([40, 20])
  expect(balanceTestPlans(["b", "a", "c"], 2, {})).toEqual([
    { files: ["a", "c"], durationMs: 200 },
    { files: ["b"], durationMs: 100 },
  ])
  expect(balanceTestPlans([], 2, {})).toEqual([
    { files: [], durationMs: 0 },
    { files: [], durationMs: 0 },
  ])
  expect(balanceTestPlans(files, 1, durations)[0].files).toHaveLength(4)
  expect(balanceTestPlans(["slow"], 3, durations)).toHaveLength(3)
})
