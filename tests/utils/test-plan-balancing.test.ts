import { expect, test } from "bun:test"
import { balanceTestFiles } from "../../scripts/generate-test-plan"

test("timing plans isolate long tests and cover every file deterministically", () => {
  const files = ["slow-a", "slow-b", "medium", "fast-a", "fast-b", "new"]
  const durations = {
    "slow-a": 200,
    "slow-b": 180,
    medium: 80,
    "fast-a": 20,
    "fast-b": 20,
  }
  const plans = balanceTestFiles(files, 3, durations)
  expect(plans.map((plan) => plan.estimatedMs)).toEqual([200, 200, 200])
  expect(plans[0].files).toEqual(["slow-a"])
  expect(plans[1].files).toEqual(["slow-b", "fast-a"])
  expect(plans.flatMap((plan) => plan.files).sort()).toEqual([...files].sort())
  expect(balanceTestFiles([...files].reverse(), 3, durations)).toEqual(plans)
  expect(balanceTestFiles(files, 1, durations)[0].files).toHaveLength(
    files.length,
  )
  const unmeasured = balanceTestFiles(files, 3, {})
  expect(unmeasured.map((plan) => plan.files.length)).toEqual([2, 2, 2])
})
