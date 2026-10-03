import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression test for #3110: an invalid capacitance string (e.g. "abc") was
// silently parsed to NaN and emitted as `capacitance: null` /
// `display_capacitance: "NaNpF"` — invalid Circuit JSON. It should instead
// throw a render error and not emit a capacitor with a NaN capacitance.

test("capacitor invalid capacitance throws a render error instead of NaN", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" capacitance="not-a-capacitance" />
    </board>,
  )

  let caught: Error | undefined
  try {
    circuit.render()
  } catch (err) {
    if (err instanceof Error) caught = err
  }

  expect(caught).toBeDefined()
  expect(caught?.message).toMatch(/Invalid capacitance/i)

  // The invalid capacitance must not reach Circuit JSON as NaN/null.
  const sourceCapacitors = circuit.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{ capacitance?: number | null; display_capacitance?: string }>
  const hasNaNCapacitance = sourceCapacitors.some(
    (c) =>
      (c.capacitance === null || Number.isNaN(c.capacitance as number)) &&
      (c.display_capacitance === "NaNpF" ||
        c.display_capacitance === "NaN"),
  )
  expect(hasNaNCapacitance).toBe(false)
})
