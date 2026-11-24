import { expect, test } from "bun:test"
import { source_simple_inductor } from "circuit-json"
import { Inductor } from "lib/components/normal-components/Inductor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor rejects invalid inductance values with a validation error without halting sibling components", async () => {
  for (const invalidValue of [
    "not-an-inductance",
    "lijH",
    "",
    "   ",
    "10V",
    "10ohm",
    "10..5uH",
    "0uH",
    "-10uH",
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    expect(
      () =>
        new Inductor({
          name: "L_BAD",
          footprint: "0402",
          inductance: invalidValue as any,
        }),
    ).toThrow()
  }

  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <inductor name="L1" inductance="not-an-inductance" footprint="0402" />
      <inductor name="L2" inductance="" footprint="0402" />
      <inductor name="L3" inductance="10V" footprint="0402" />
      <inductor name="L_OK" inductance="10uH" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceInductors = circuit.db.source_component.list({
    ftype: "simple_inductor",
  })
  expect(sourceInductors).toHaveLength(1)
  expect(sourceInductors[0].name).toBe("L_OK")
  expect(source_simple_inductor.safeParse(sourceInductors[0]).success).toBe(
    true,
  )

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(3)
  expect(errors.map((e) => e.component_name)).toEqual(["L1", "L2", "L3"])
})
