import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C schematic dimensions and shell margin can be overridden", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        standard="usb_c"
        schWidth={2.4}
        schHeight={4.2}
        schPinStyle={{ SHELL4: { marginRight: 0.5 } }}
        pinLabels={{
          pin1: "GND1",
          pin2: "VBUS1",
          pin3: "CC1",
          pin4: "DP1",
          pin5: "DM1",
          pin6: "SBU1",
          pin7: "SBU2",
          pin8: "DM2",
          pin9: "DP2",
          pin10: "CC2",
          pin11: "VBUS2",
          pin12: "GND2",
          pin13: "SHELL1",
          pin14: "SHELL2",
          pin15: "SHELL3",
          pin16: "SHELL4",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const shell4Port = circuit.db.schematic_port
    .list()
    .find((port) => port.display_pin_label === "SHELL4")!
  const schematicComponent = circuit.db.schematic_component.get(
    shell4Port.schematic_component_id!,
  )!

  expect(schematicComponent.size).toEqual({ width: 2.4, height: 4.2 })
  expect(shell4Port.center.x - schematicComponent.center.x).toBeCloseTo(0.05)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
