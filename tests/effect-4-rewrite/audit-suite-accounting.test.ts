import { expect, test } from "bun:test"
import {
  declaredTestTimeoutMs,
  parseBunTestLog,
} from "../../scripts/effect-4/validation-log"

test("validation accounting distinguishes completed tests, skips and file-loading errors", () => {
  const parsed = parseBunTestLog(
    [
      "bun test v1.4.0",
      "tests/examples/working.test.tsx:",
      "(pass) board renders [4.50ms]",
      "(skip) unsupported external platform",
      "tests/examples/broken-import.test.ts:",
      "# Unhandled error between tests",
      "error: Module not found",
      "tests/examples/failing.test.tsx:",
      "(fail) original fixture expectation [2.00ms]",
      "tests/examples/unfinished.test.ts:",
    ].join("\n"),
  )
  expect(parsed.reached).toEqual([
    "tests/examples/working.test.tsx",
    "tests/examples/broken-import.test.ts",
    "tests/examples/failing.test.tsx",
    "tests/examples/unfinished.test.ts",
  ])
  expect(parsed.caseCountsByFile["tests/examples/working.test.tsx"]).toEqual({
    pass: 1,
    fail: 0,
    skip: 1,
    todo: 0,
    error: 0,
  })
  expect(
    parsed.caseCountsByFile["tests/examples/broken-import.test.ts"].error,
  ).toBe(1)
  expect(parsed.caseCountsByFile["tests/examples/failing.test.tsx"].fail).toBe(
    1,
  )
  expect(
    parsed.caseCountsByFile["tests/examples/unfinished.test.ts"].pass,
  ).toBe(0)
  expect(declaredTestTimeoutMs('test("long", () => {}, 600_000)')).toBe(600000)
  expect(
    declaredTestTimeoutMs('test("configured", () => {}, { timeout: 45_000 })'),
  ).toBe(45000)
  expect(
    declaredTestTimeoutMs(
      'test("geometry", () => createBoard({width: 900_000}))',
    ),
  ).toBe(0)

  const summaryReplay = parseBunTestLog(
    [
      "tests/examples/cache.test.tsx:",
      "(pass) cache setup [1.00ms]",
      "(fail) board cache count [2.00ms]",
      "(fail) subpanel cache count [3.00ms]",
      "(skip) optional cache benchmark",
      "tests/examples/final-snapshot.test.tsx:",
      "(pass) final PCB snapshot [4.00ms]",
      "1 tests skipped:",
      "(skip) optional cache benchmark",
      "\u001b[31m2 tests failed:\u001b[0m",
      "(fail) board cache count [2.00ms]",
      "(fail) subpanel cache count [3.00ms]",
      " 2 pass",
      " 1 skip",
      " 2 fail",
      "Ran 5 tests across 2 files. [10.00ms]",
      "--- stdout ---",
      "tests/examples/logged-output.test.ts:",
      "(fail) text printed by a test",
    ].join("\n"),
  )
  expect(summaryReplay.reached).toEqual([
    "tests/examples/cache.test.tsx",
    "tests/examples/final-snapshot.test.tsx",
  ])
  expect(
    summaryReplay.caseCountsByFile["tests/examples/cache.test.tsx"],
  ).toEqual({
    pass: 1,
    fail: 2,
    skip: 1,
    todo: 0,
    error: 0,
  })
  expect(
    summaryReplay.caseCountsByFile["tests/examples/final-snapshot.test.tsx"],
  ).toEqual({ pass: 1, fail: 0, skip: 0, todo: 0, error: 0 })

  const successfulSummary = parseBunTestLog(
    [
      "tests/examples/success.test.ts:",
      "(pass) body result [1.00ms]",
      " 1 pass",
      " 0 fail",
      "Ran 1 test across 1 file. [1.00ms]",
      "(pass) text after the aggregate footer",
    ].join("\n"),
  )
  expect(
    successfulSummary.caseCountsByFile["tests/examples/success.test.ts"].pass,
  ).toBe(1)
})
