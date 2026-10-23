import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C box still expands for long custom pin labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        standard="usb_c"
        pinLabels={{
          pin1: ["USB_SUPPLY_VOLTAGE_INPUT", "VBUS1"],
          pin2: "SHELL4",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]!
  expect(schematicComponent.size.width).toBeGreaterThanOrEqual(3)
  expect(
    circuit.db.schematic_port.list().find((port) => port.pin_number === 1)
      ?.display_pin_label,
  ).toBe("USB_SUPPLY_VOLTAGE_INPUT")
})
