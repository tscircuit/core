import { expect, test } from "bun:test"
import { source_simple_inductor } from "circuit-json"
import { Inductor } from "lib/components/normal-components/Inductor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor emits parsed numeric inductance in henries for unit strings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <inductor name="L1" footprint="0603" inductance="10uH" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceInductor = circuit.db.source_component
    .list()
    .find((c) => c.type === "source_component" && c.name === "L1")

  expect(sourceInductor).toBeDefined()
  expect(typeof (sourceInductor as any).inductance).toBe("number")
  expect((sourceInductor as any).inductance).toBeCloseTo(1e-5, 12)
  expect(source_simple_inductor.safeParse(sourceInductor).success).toBe(true)
})

test("inductor rejects invalid inductance strings with a validation error instead of emitting NaNpH", async () => {
  expect(
    () =>
      new Inductor({
        name: "L1",
        footprint: "0603",
        inductance: "not-an-inductance" as any,
      }),
  ).toThrow(/inductance/i)

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <inductor name="L1" footprint="0603" inductance="not-an-inductance" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.list()).toHaveLength(0)
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toMatch(/inductance/i)
})
