import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro186: multi-pin signal net creates a long detour", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />

      <chip
        name="MK1"
        pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "OUT" }}
        schWidth="1.7mm"
        schHeight="0.4mm"
        schPinArrangement={{
          leftSide: {
            pins: ["VDD", "GND"],
            direction: "top-to-bottom",
          },
          rightSide: { pins: ["OUT"], direction: "top-to-bottom" },
        }}
      />

      <chip
        name="U1"
        pinLabels={{
          pin1: "INA_POS",
          pin2: "INA_NEG",
          pin3: "INB_POS",
          pin4: "INB_NEG",
          pin5: "VDD",
          pin6: "OUTA",
          pin7: "OUTB",
          pin8: "VSS_NEG",
        }}
        schWidth="2.5mm"
        schHeight="1mm"
        schPinArrangement={{
          leftSide: {
            pins: ["INA_POS", "INA_NEG", "INB_POS", "INB_NEG"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["VDD", "OUTA", "OUTB", "VSS_NEG"],
            direction: "top-to-bottom",
          },
        }}
      />

      <capacitor name="C5" capacitance="100nF" schOrientation="vertical" />
      <resistor name="R3" resistance="100k" schOrientation="vertical" />
      <resistor name="R4" resistance="10k" schOrientation="vertical" />
      <resistor name="R5" resistance="100k" />
      <resistor name="R6" resistance="10k" />
      <capacitor name="C6" capacitance="10nF" schOrientation="vertical" />

      <trace from=".MK1 > .VDD" to="net.VCC" />
      <trace from=".MK1 > .GND" to="net.GND" />
      <trace from=".MK1 > .OUT" to=".C5 > .pin1" />
      <trace from=".C5 > .pin2" to="net.MIC_AC" />
      <trace from=".R3 > .pin1" to="net.MIC_AC" />
      <trace from=".R3 > .pin2" to="net.VREF" />
      <trace from=".U1 > .INA_POS" to="net.MIC_AC" />
      <trace from=".U1 > .INA_NEG" to="net.FB_A" />
      <trace from=".R4 > .pin1" to="net.FB_A" />
      <trace from=".R4 > .pin2" to="net.VREF" />

      {/*
       * PREAMP is one three-endpoint signal net. Auto-layout places its two
       * passive branches so the routed connection takes a long U-shaped path.
       */}
      <trace from=".U1 > .OUTA" to="net.PREAMP" />
      <trace from=".R5 > .pin1" to="net.PREAMP" />
      <trace from=".R5 > .pin2" to="net.FB_A" />
      <trace from=".R6 > .pin1" to="net.PREAMP" />
      <trace from=".R6 > .pin2" to="net.FILTER" />
      <trace from=".C6 > .pin1" to="net.FILTER" />
      <trace from=".C6 > .pin2" to="net.GND" />
      <trace from=".U1 > .INB_POS" to="net.FILTER" />
      <trace from=".U1 > .INB_NEG" to="net.AUDIO_ADC" />
      <trace from=".U1 > .OUTB" to="net.AUDIO_ADC" />
      <trace from=".U1 > .VDD" to="net.VCC" />
      <trace from=".U1 > .VSS_NEG" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
