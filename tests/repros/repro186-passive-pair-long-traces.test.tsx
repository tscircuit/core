import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const amplifierPinLabels = {
  pin1: "OUTA",
  pin2: "INA_NEG",
  pin3: "INA_POS",
  pin4: "VSS_NEG",
  pin5: "INB_POS",
  pin6: "INB_NEG",
  pin7: "OUTB",
  pin8: "VDD",
} as const

const indicatorBranches = [
  { pin: "PA4", resistor: "R7", led: "LED_E2", color: "yellow" },
  { pin: "PA5", resistor: "R8", led: "LED_A2", color: "yellow" },
  { pin: "PA6", resistor: "R9", led: "LED_D3", color: "yellow" },
  { pin: "PA7", resistor: "R10", led: "LED_G3", color: "yellow" },
  { pin: "PB5", resistor: "R11", led: "LED_B3", color: "yellow" },
  { pin: "PB4", resistor: "R12", led: "LED_E4", color: "yellow" },
  { pin: "PB3", resistor: "R13", led: "LED_FLAT", color: "red" },
] as const

// The surrounding branches keep the automatic packing from the original
// schematic. No component or trace coordinates are supplied. The current
// result sends the C4/C7 and R5/R6 connections far outside their local area.
test("repro186: passive pairs produce long schematic traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <schematicsheet name="main" sheetSize="A4">
        <chip
          name="BT1"
          manufacturerPartNumber="XDCR-2032-603"
          pinLabels={{ pin1: ["1"], pin2: ["2"] }}
          pinAttributes={{
            pin1: { providesPower: true },
            pin2: { requiresGround: true },
          }}
          symbol={
            <symbol>
              <port
                name="pin2"
                pinNumber={2}
                aliases={["2"]}
                direction="down"
                schX={0}
                schY={-0.4}
                schStemLength={0.3}
              />
              <port
                name="pin1"
                pinNumber={1}
                aliases={["1"]}
                direction="up"
                schX={0}
                schY={0.4}
                schStemLength={0.3}
              />
              <schematicpath
                points={[
                  { x: 0.08, y: 0.1 },
                  { x: 0.08, y: -0.08 },
                ]}
              />
              <schematicpath
                points={[
                  { x: 0.02, y: 0.18 },
                  { x: 0.02, y: -0.14 },
                ]}
              />
              <schematicpath
                points={[
                  { x: -0.04, y: 0.1 },
                  { x: -0.04, y: -0.08 },
                ]}
              />
              <schematicpath
                points={[
                  { x: -0.1, y: 0.18 },
                  { x: -0.1, y: -0.14 },
                ]}
              />
            </symbol>
          }
        />
        <switch
          name="SW1"
          manufacturerPartNumber="MSK12C02"
          schRotation={90}
          pinLabels={{
            pin1: "pin1",
            pin2: "pin2",
            pin3: "pin3",
            pin4: "pin4",
          }}
        />
        <capacitor name="C1" capacitance="100nF" schOrientation="vertical" />
        <capacitor name="C2" capacitance="1uF" schOrientation="vertical" />
        <resistor name="R1" resistance="100k" schOrientation="vertical" />
        <resistor name="R2" resistance="100k" schOrientation="vertical" />
        <capacitor name="C3" capacitance="1uF" schOrientation="vertical" />
        <capacitor name="C7" capacitance="100nF" schOrientation="vertical" />

        <chip
          name="MK1"
          manufacturerPartNumber="MSM381ACB026"
          pinLabels={{ pin1: "VDD", pin2: "OUT", pin3: "GND" }}
          pinAttributes={{
            pin1: { requiresPower: true },
            pin3: { requiresGround: true },
          }}
          schWidth={1.7}
          schHeight={0.4}
          schPinArrangement={{
            leftSide: { pins: ["VDD", "GND"], direction: "top-to-bottom" },
            rightSide: { pins: ["OUT"], direction: "top-to-bottom" },
          }}
        />
        <capacitor name="C4" capacitance="100nF" schOrientation="vertical" />
        <capacitor name="C5" capacitance="100nF" schOrientation="vertical" />
        <resistor name="R3" resistance="100k" schOrientation="vertical" />
        <chip
          name="U1"
          manufacturerPartNumber="MCP6002T-I/SN"
          pinLabels={amplifierPinLabels}
          pinAttributes={{
            pin4: { requiresGround: true },
            pin8: { requiresPower: true },
          }}
          schWidth={2.5}
          schHeight={1}
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
        <resistor name="R4" resistance="10k" schOrientation="vertical" />
        <resistor name="R5" resistance="100k" />
        <resistor name="R6" resistance="10k" />
        <capacitor name="C6" capacitance="10nF" schOrientation="vertical" />
        <chip
          name="U2"
          manufacturerPartNumber="ATTINY1616-MNR"
          pinLabels={{
            pin1: "PA2",
            pin2: "PA3",
            pin3: "GND",
            pin4: "VDD",
            pin5: "PA4",
            pin6: "PA5",
            pin7: "PA6",
            pin8: "PA7",
            pin9: "PB5",
            pin10: "PB4",
            pin11: "PB3",
            pin12: "PB2",
            pin13: "PB1",
            pin14: "PB0",
            pin15: "PC0",
            pin16: "PC1",
            pin17: "PC2",
            pin18: "PC3",
            pin19: "PA0_UPDI",
            pin20: "PA1",
            pin21: "EP",
          }}
          schWidth={2.2}
          schHeight={2.2}
          pinAttributes={{
            pin3: { requiresGround: true },
            pin4: { requiresPower: true },
            pin19: { mustBeConnected: true },
            pin21: { requiresGround: true },
          }}
          schPinArrangement={{
            leftSide: {
              pins: [
                "VDD",
                "PA2",
                "PA3",
                "PA4",
                "PA5",
                "PA6",
                "PA7",
                "PA1",
                "PA0_UPDI",
                "GND",
                "EP",
              ],
              direction: "top-to-bottom",
            },
            rightSide: {
              pins: [
                "PB5",
                "PB4",
                "PB3",
                "PB2",
                "PB1",
                "PB0",
                "PC0",
                "PC1",
                "PC2",
                "PC3",
              ],
              direction: "top-to-bottom",
            },
          }}
        />
        <pushbutton
          name="SW2"
          manufacturerPartNumber="HX 3x4x2-2P-1.6N TACTILE SWITCH"
          schRotation={-90}
        />
        <testpoint name="TP_UPDI" />
        <testpoint name="TP_VCC" />
        <testpoint name="TP_GND" />
        {indicatorBranches.map(({ resistor, led, color }) => (
          <Fragment key={resistor}>
            <resistor
              name={resistor}
              resistance="1k"
              schOrientation="vertical"
            />
            <led
              name={led}
              manufacturerPartNumber={
                color === "yellow" ? "XL-1608UYC-06" : "XL-1608SURC-06"
              }
              color={color}
              pinLabels={{
                pin1: ["cathode", "neg"],
                pin2: ["anode", "pos"],
              }}
              schRotation={90}
            />
          </Fragment>
        ))}

        <trace from="BT1.pin1" to="SW1.pin1" />
        <trace from="BT1.pin2" to="net.GND" />
        <trace from="SW1.pin2" to="net.VCC" />

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
        <trace from="C7.pin1" to="net.VCC" />
        <trace from="C7.pin2" to="net.GND" />

        <trace from="MK1.VDD" to="net.VCC" />
        <trace from="MK1.GND" to="net.GND" />
        <trace from="C4.pin1" to="net.VCC" />
        <trace from="C4.pin2" to="net.GND" />
        <trace from="MK1.OUT" to="C5.pin1" />
        <trace from="C5.pin2" to="net.MIC_AC" />
        <trace from="R3.pin1" to="net.MIC_AC" />
        <trace from="R3.pin2" to="net.VREF" />
        <trace from="U1.INA_POS" to="net.MIC_AC" />
        <trace from="U1.INA_NEG" to="net.FB_A" />
        <trace from="R4.pin1" to="net.FB_A" />
        <trace from="R4.pin2" to="net.VREF" />
        <trace from="U1.OUTA" to="net.PREAMP" />
        <trace from="R5.pin1" to="net.PREAMP" />
        <trace from="R5.pin2" to="net.FB_A" />
        <trace from="R6.pin1" to="net.PREAMP" />
        <trace from="R6.pin2" to="net.FILTER" />
        <trace from="C6.pin1" to="net.FILTER" />
        <trace from="C6.pin2" to="net.GND" />
        <trace from="U1.INB_POS" to="net.FILTER" />
        <trace from="U1.INB_NEG" to="net.AUDIO_ADC" />
        <trace from="U1.OUTB" to="net.AUDIO_ADC" />
        <trace from="U1.VDD" to="net.VCC" />
        <trace from="U1.VSS_NEG" to="net.GND" />

        <trace from="U2.VDD" to="net.VCC" />
        <trace from="U2.GND" to="net.GND" />
        <trace from="U2.EP" to="net.GND" />
        <trace from="U2.PA2" to="net.AUDIO_ADC" />
        <trace from="U2.PB0" to="SW2.pin1" />
        <trace from="SW2.pin2" to="net.GND" />
        <trace from="U2.PA0_UPDI" to="TP_UPDI.pin1" />
        <trace from="TP_VCC.pin1" to="net.VCC" />
        <trace from="TP_GND.pin1" to="net.GND" />
        {indicatorBranches.map(({ pin, resistor, led }) => (
          <Fragment key={pin}>
            <trace from={`U2.${pin}`} to={`${resistor}.pin1`} />
            <trace from={`${resistor}.pin2`} to={`${led}.pos`} />
            <trace from={`${led}.neg`} to="net.GND" />
          </Fragment>
        ))}
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1200,
    height: 700,
  })
})
