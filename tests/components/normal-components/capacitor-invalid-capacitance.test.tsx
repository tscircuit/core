import { expect, test } from "bun:test"
import { source_simple_capacitor } from "circuit-json"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor rejects invalid capacitance strings with a validation error without halting sibling components", async () => {
  for (const invalidValue of [
    "not-a-capacitance",
    "lijF",
    "",
    "   ",
    "10V",
    "10ohm",
    "10..5uF",
    "0uF",
    "-10uF",
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    expect(
      () =>
        new Capacitor({
          name: "C_BAD",
          footprint: "0402",
          capacitance: invalidValue as any,
        }),
    ).toThrow(/capacitance/i)
  }

  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <capacitor name="C1" capacitance="not-a-capacitance" footprint="0402" />
      <capacitor name="C2" capacitance="" footprint="0402" />
      <capacitor name="C3" capacitance="10V" footprint="0402" />
      <capacitor name="C_OK" capacitance="10uF" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceCapacitors = circuit.db.source_component.list({
    ftype: "simple_capacitor",
  })
  expect(sourceCapacitors).toHaveLength(1)
  expect(sourceCapacitors[0].name).toBe("C_OK")
  expect(source_simple_capacitor.safeParse(sourceCapacitors[0]).success).toBe(
    true,
  )

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(3)
  expect(errors.map((e) => e.component_name)).toEqual(["C1", "C2", "C3"])
  for (const err of errors) {
    expect(err.message).toMatch(/Invalid capacitance/i)
  }
})

test("capacitor accepts valid numeric, bare-prefix, and case-insensitive Farad strings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <capacitor name="C1" capacitance="10uF" footprint="0402" />
      <capacitor name="C2" capacitance="0.1uf" footprint="0402" />
      <capacitor name="C3" capacitance="100n" footprint="0402" />
      <capacitor name="C4" capacitance="10µF" footprint="0402" />
      <capacitor name="C5" capacitance={1e-6} footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toHaveLength(0)

  const byName = new Map(
    circuit.db.source_component
      .list({ ftype: "simple_capacitor" })
      .map((c: any) => [c.name, c]),
  )

  expect(byName.get("C1")?.capacitance).toBe(0.00001)
  expect(byName.get("C2")?.capacitance).toBe(1e-7)
  expect(byName.get("C3")?.capacitance).toBe(1e-7)
  expect(byName.get("C4")?.capacitance).toBe(0.00001)
  expect(byName.get("C5")?.capacitance).toBe(0.000001)
})
