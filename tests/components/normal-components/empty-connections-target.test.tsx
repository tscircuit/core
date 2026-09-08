import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty connections target does not crash render", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.property_name).toBe("connections")
  expect(errors[0]?.message).toMatch(/C1/)
  expect(errors[0]?.message).toMatch(/pin1/)
})
