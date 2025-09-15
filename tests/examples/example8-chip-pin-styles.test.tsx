import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with custom schematic pin styles", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        schPinArrangement={{
          topSide: {
            direction: "left-to-right",
            pins: ["VCC"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["GND"],
          },
          leftSide: {
            direction: "top-to-bottom",
            pins: ["DISCH", "THRES", "CTRL"],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: ["TRIG", "OUT", "RESET"],
          },
        }}
        schPinStyle={{
          pin1: {
            marginBottom: 0.2,
          },
          GND: { marginRight: "0.5mm" },
          THRES: { marginTop: 0.5 },
          OUT: {
            marginTop: 1,
            marginBottom: "1mm",
          },
        }}
        pinLabels={{
          pin1: "VCC",
          pin2: "DISCH",
          pin3: "THRES",
          pin4: "CTRL",
          pin5: "GND",
          pin6: "TRIG",
          pin7: "OUT",
          pin8: "RESET",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify the schematic rendering with pin styles
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
