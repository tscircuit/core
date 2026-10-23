import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: default USB-C box crowds SHELL4 and right-side labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        standard="usb_c"
        pinLabels={{
          pin1: "SHELL2",
          pin2: "SHELL1",
          pin3: "SHELL4",
          pin4: "SHELL3",
          pin5: "SBU2",
          pin6: "CC1",
          pin7: "DM2",
          pin8: "DP1",
          pin9: "DM1",
          pin10: "DP2",
          pin11: "SBU1",
          pin12: "CC2",
          pin13: "GND1",
          pin14: "GND2",
          pin15: "VBUS1",
          pin16: "VBUS2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Keep the default box sizing and pin arrangement: SHELL4 is too close to
  // SBU2, GND1, and GND2 at the lower-right corner (minimum clearance: 0.1).
  expect(circuit.db.schematic_port.list()).toHaveLength(16)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
