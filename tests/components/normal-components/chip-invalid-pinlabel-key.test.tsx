import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pinLabels invalid key emits circuit json error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          foo: "VCC",
        }}
      />
    </board>,
  )

  circuit.render()

  const errors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_property_ignored_warning")

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toBe(
    'Invalid pinLabels key "foo" - expected a number or "pin${number}".',
  )
})
