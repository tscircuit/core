import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression test for #3114: an invalid inductance value (e.g. "abc") was
// silently parsed to NaN and emitted as `inductance: NaN` /
// `display_inductance: "NaNpH"` — invalid Circuit JSON. It should instead
// throw a render error and not emit a source component with a NaN inductance.

test("inductor invalid inductance throws a render error instead of NaN", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <inductor name="L1" inductance="not-an-inductance" />
    </board>,
  )

  let caught: Error | undefined
  try {
    circuit.render()
  } catch (err) {
    if (err instanceof Error) caught = err
  }

  expect(caught).toBeDefined()
  expect(caught?.message).toMatch(/Invalid inductance/i)

  // The invalid inductance must not reach Circuit JSON as NaN.
  const sourceInductors = circuit.db.source_component.list({
    ftype: "simple_inductor",
  }) as Array<{ inductance?: number | null; display_inductance?: string }>
  const hasNaNInductance = sourceInductors.some(
    (c) =>
      (c.inductance === null || Number.isNaN(c.inductance as number)) &&
      (c.display_inductance === "NaNpH" ||
        c.display_inductance === "NaN"),
  )
  expect(hasNaNInductance).toBe(false)
})
