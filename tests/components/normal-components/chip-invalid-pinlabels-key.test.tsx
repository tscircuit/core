import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with alphanumeric pinLabels keys (KiCad-style) renders correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <connector
        name="J1"
        footprint="usb_c_16p"
        pinLabels={{
          A1: "GND",
          B12: "GND",
          A5: "CC1",
          B5: "CC2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Alphanumeric pin keys like "A1", "B12" are valid KiCad-style pin names.
  // They should be normalized to pin<N> format internally.
  const errors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_failed_to_create_component_error")

  expect(errors).toHaveLength(0)

  // The component should have been created successfully
  const sourceComponents = circuit.db.source_component.list()
  expect(sourceComponents).toHaveLength(1)
})
