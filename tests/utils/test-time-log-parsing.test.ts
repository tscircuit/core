import { expect, test } from "bun:test"
import { readTestTimes } from "../../scripts/report-test-times"

test("timing logs aggregate multiple cases and keep interleaved CI jobs separate", () => {
  expect(
    readTestTimes(
      [
        "test (1)\tRun tests\t2026-09-30T00:00:00Z ##[group]tests/one.test.ts:",
        "test (2)\tRun tests\t2026-09-30T00:00:00Z ##[group]tests/two.test.tsx:",
        "test (1)\tRun tests\t2026-09-30T00:00:00Z (pass) first [12.50ms]",
        "test (2)\tRun tests\t2026-09-30T00:00:00Z (fail) second [30000.00ms]",
        "test (1)\tRun tests\t2026-09-30T00:00:00Z (pass) third [2.50ms]",
        "tests/skipped.test.ts:",
        "(skip) pending",
        "\x1b[32mtests/local.test.ts:\x1b[0m",
        "✓ local [1.25ms]",
        "✓ local second [2.75ms]",
        "Ran 2 tests across 1 file. [100.00ms]",
        "::group::tests/captured.test.ts:",
        "(pass) captured CI output [99.50ms]",
        "::endgroup::",
      ].join("\n"),
    ),
  ).toEqual({
    "tests/one.test.ts": 15,
    "tests/two.test.tsx": 30000,
    "tests/skipped.test.ts": 0,
    "tests/local.test.ts": 4,
    "tests/captured.test.ts": 99.5,
  })
})
