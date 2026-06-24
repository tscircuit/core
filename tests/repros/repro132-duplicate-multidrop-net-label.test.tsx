import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro132: duplicate labels on a multidrop named net", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R8_BAT_TOP" resistance="200k" footprint="0402" />
      <resistor name="R9_BAT_BOTTOM" resistance="100k" footprint="0402" />

      <capacitor name="C2_BAT" capacitance="10uF" footprint="0603" />

      <chip
        name="J2_BATTERY"
        footprint="pinheader2"
        pinLabels={{
          pin1: "BAT",
          pin2: "GND",
        }}
      />

      <chip
        name="U1_CHARGER"
        footprint="qfn20"
        pinLabels={{
          pin1: "VBAT",
          pin2: "GND",
        }}
      />

      <chip
        name="U3_MCU"
        footprint="qfn32"
        pinLabels={{
          pin1: "ADC",
          pin2: "GND",
        }}
      />

      <trace from="R8_BAT_TOP.pin1" to="net.BAT" />
      <trace from="C2_BAT.pin1" to="net.BAT" />
      <trace from="J2_BATTERY.BAT" to="net.BAT" />
      <trace from="U1_CHARGER.VBAT" to="net.BAT" />

      <trace from="R8_BAT_TOP.pin2" to="net.BAT_SENSE" />
      <trace from="R9_BAT_BOTTOM.pin1" to="net.BAT_SENSE" />
      <trace from="U3_MCU.ADC" to="net.BAT_SENSE" />

      <trace from="C2_BAT.pin2" to="net.GND" />
      <trace from="J2_BATTERY.GND" to="net.GND" />
      <trace from="U1_CHARGER.GND" to="net.GND" />
      <trace from="R9_BAT_BOTTOM.pin2" to="net.GND" />
      <trace from="U3_MCU.GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
