import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SignalLed = ({
  name,
  color,
}: {
  name: string
  color: "red" | "yellow" | "green"
}) => (
  <led
    name={name}
    color={color}
    footprint="1206_cathodepin1_anodepin2"
    pinLabels={{ 1: "cathode", 2: "anode" }}
    pcbMarginX="1mm"
    pcbMarginY="1mm"
  />
)

export default function TrafficLightController() {
  return (
    <board name="TRAFFIC_LIGHT_CONTROLLER" pcbPack pcbPackGap="0.2mm">
      {/* 555 clock generator */}
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
      />

      {/* CD4017 decade counter */}
      <chip
        name="U2"
        footprint="soic16"
        pinLabels={{
          pin1: "Q5",
          pin2: "Q1",
          pin3: "Q0",
          pin4: "Q2",
          pin5: "Q6",
          pin6: "Q7",
          pin7: "Q3",
          pin8: "GND",
          pin9: "Q8",
          pin10: "Q4",
          pin11: "Q9",
          pin12: "CARRY",
          pin13: "CLOCK_INHIBIT",
          pin14: "CLOCK",
          pin15: "RESET",
          pin16: "VCC",
        }}
      />

      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2_p2.54_id1.016mm_od1.88mm"
      />

      {/* 555 timing components */}
      <resistor name="RT1" resistance="10k" footprint="0603" />
      <resistor name="RT2" resistance="68k" footprint="0603" />
      <capacitor name="CT" capacitance="10uF" footprint="1206" />
      <capacitor name="CCTRL" capacitance="10nF" footprint="0603" />

      {/* Power decoupling */}
      <capacitor name="CDEC1" capacitance="100nF" footprint="0603" />
      <capacitor name="CDEC2" capacitance="100nF" footprint="0603" />

      {/* Traffic-light outputs */}
      <SignalLed name="D1" color="red" />
      <resistor name="R1" resistance="330" footprint="0603" />

      <SignalLed name="D2" color="yellow" />
      <resistor name="R2" resistance="330" footprint="0603" />

      <SignalLed name="D3" color="green" />
      <resistor name="R3" resistance="330" footprint="0603" />

      {/* Power input */}
      <trace from=".J1 > .pin1" to="net.VCC" />
      <trace from=".J1 > .pin2" to="net.GND" />

      {/* 555 power */}
      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".U1 > .RESET" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />

      {/* 555 timing network */}
      <trace from=".RT1 > .pin1" to="net.VCC" />
      <trace from=".RT1 > .pin2" to=".U1 > .DISCH" />
      <trace from=".U1 > .DISCH" to=".RT2 > .pin1" />

      <trace from=".RT2 > .pin2" to="net.TIMING" />
      <trace from=".U1 > .TRIG" to="net.TIMING" />
      <trace from=".U1 > .THRES" to="net.TIMING" />
      <trace from=".CT > .pin1" to="net.TIMING" />
      <trace from=".CT > .pin2" to="net.GND" />

      <trace from=".U1 > .CTRL" to=".CCTRL > .pin1" />
      <trace from=".CCTRL > .pin2" to="net.GND" />

      <trace from=".CDEC1 > .pin1" to="net.VCC" />
      <trace from=".CDEC1 > .pin2" to="net.GND" />

      {/* 555 output clocks the CD4017 */}
      <trace from=".U1 > .OUT" to=".U2 > .CLOCK" />

      {/* CD4017 power and three-step reset */}
      <trace from=".U2 > .VCC" to="net.VCC" />
      <trace from=".U2 > .GND" to="net.GND" />
      <trace from=".U2 > .CLOCK_INHIBIT" to="net.GND" />
      <trace from=".U2 > .Q3" to=".U2 > .RESET" />

      <trace from=".CDEC2 > .pin1" to="net.VCC" />
      <trace from=".CDEC2 > .pin2" to="net.GND" />

      {/* Red output */}
      <trace from=".U2 > .Q0" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".D1 > .anode" />
      <trace from=".D1 > .cathode" to="net.GND" />

      {/* Yellow output */}
      <trace from=".U2 > .Q1" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".D2 > .anode" />
      <trace from=".D2 > .cathode" to="net.GND" />

      {/* Green output */}
      <trace from=".U2 > .Q2" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".D3 > .anode" />
      <trace from=".D3 > .cathode" to="net.GND" />
    </board>
  )
}

test("adjacent LED output branches overlap schematic annotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<TrafficLightController />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
