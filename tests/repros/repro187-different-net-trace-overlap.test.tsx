import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// R2.pin2 is GND and C3.pin1 is VREF, but their generated traces overlap.
test("repro187: different-net traces overlap between vertical passives", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <capacitor name="C1" capacitance="100nF" schOrientation="vertical" />
      <capacitor name="C2" capacitance="1uF" schOrientation="vertical" />
      <resistor name="R1" resistance="100k" schOrientation="vertical" />
      <resistor name="R2" resistance="100k" schOrientation="vertical" />
      <capacitor name="C3" capacitance="1uF" schOrientation="vertical" />
      <chip
        name="MK1"
        pinLabels={{ pin1: "VDD", pin2: "OUT", pin3: "GND" }}
        schWidth={1.7}
        schHeight={0.4}
        schPinArrangement={{
          leftSide: { pins: ["VDD", "GND"], direction: "top-to-bottom" },
          rightSide: { pins: ["OUT"], direction: "top-to-bottom" },
        }}
      />
      <capacitor name="C5" capacitance="100nF" schOrientation="vertical" />
      <chip
        name="U1"
        pinLabels={{
          pin1: "OUTA",
          pin2: "INA_NEG",
          pin3: "INA_POS",
          pin4: "VSS_NEG",
          pin5: "INB_POS",
          pin6: "INB_NEG",
          pin7: "OUTB",
          pin8: "VCC",
        }}
        schWidth={2.5}
        schHeight={1}
        schPinArrangement={{
          leftSide: {
            pins: ["INA_POS", "INA_NEG", "INB_POS", "INB_NEG"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["VCC", "OUTA", "OUTB", "VSS_NEG"],
            direction: "top-to-bottom",
          },
        }}
      />

      <trace from="C1.pin1" to="net.VCC" />
      <trace from="C1.pin2" to="net.GND" />
      <trace from="C2.pin1" to="net.VCC" />
      <trace from="C2.pin2" to="net.GND" />
      <trace from="R1.pin1" to="net.VCC" />
      <trace from="R1.pin2" to="net.VREF" />
      <trace from="R2.pin1" to="net.VREF" />
      <trace from="R2.pin2" to="net.GND" />
      <trace from="C3.pin1" to="net.VREF" />
      <trace from="C3.pin2" to="net.GND" />
      <trace from="MK1.VDD" to="net.VCC" />
      <trace from="MK1.GND" to="net.GND" />
      <trace from="MK1.OUT" to="C5.pin1" />
      <trace from="C5.pin2" to="net.MIC_AC" />
      <trace from="U1.INA_POS" to="net.MIC_AC" />
      <trace from="U1.VCC" to="net.VCC" />
      <trace from="U1.VSS_NEG" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
