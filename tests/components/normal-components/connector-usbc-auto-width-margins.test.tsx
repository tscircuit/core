import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C automatic width respects custom shell pin margins", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        standard="usb_c"
        pinLabels={{ pin1: "SHELL4" }}
        schPinStyle={{ SHELL4: { marginRight: 2 } }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]!
  expect(schematicComponent.size.width).toBeCloseTo(2.4)
})
