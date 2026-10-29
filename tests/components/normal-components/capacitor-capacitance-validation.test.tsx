import { expect, test } from "bun:test"
import { source_simple_capacitor } from "circuit-json"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor emits parsed numeric capacitance in farads for unit strings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" footprint="0402" capacitance="10uF" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceCapacitor = circuit.db.source_component
    .list()
    .find((c) => c.type === "source_component" && c.name === "C1")

  expect(sourceCapacitor).toBeDefined()
  expect(typeof (sourceCapacitor as any).capacitance).toBe("number")
  expect((sourceCapacitor as any).capacitance).toBeCloseTo(1e-5, 12)
  expect(source_simple_capacitor.safeParse(sourceCapacitor).success).toBe(true)
})

test("capacitor rejects invalid capacitance strings with a validation error instead of emitting NaNpF", async () => {
  expect(
    () =>
      new Capacitor({
        name: "C1",
        footprint: "0402",
        capacitance: "not-a-capacitance" as any,
      }),
  ).toThrow(/capacitance/i)

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" footprint="0402" capacitance="not-a-capacitance" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.list()).toHaveLength(0)
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toMatch(/capacitance/i)
})
