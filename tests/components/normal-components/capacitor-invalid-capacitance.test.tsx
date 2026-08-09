import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor with invalid capacitance produces a validation error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <capacitor name="C1" capacitance="not-a-capacitance" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_component.list({ ftype: "simple_capacitor" }),
  ).toHaveLength(0)
  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toMatchObject([
    {
      component_name: "C1",
      message: expect.stringContaining(
        'Invalid props for capacitor "C1": capacitance',
      ),
    },
  ])
})
