import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { K3_1280S_F1 } from "./imports/K3_1280S_F1"
import { MIC5219_3_3YM5_TR } from "./imports/MIC5219_3_3YM5_TR"
import { SS34 } from "./imports/SS34"

const fp0603 = "0603"
const section = "Power Input & 3V3 Regulator"
const usbCPinLabels = {
  pin1: ["VBUS1"],
  pin2: ["VBUS2"],
  pin3: ["CC1"],
  pin4: ["CC2"],
  pin5: ["DP1"],
  pin6: ["DP2"],
  pin7: ["DM1"],
  pin8: ["DM2"],
  pin9: ["SBU1"],
  pin10: ["SBU2"],
  pin11: ["GND1"],
  pin12: ["GND2"],
  pin13: ["SHELL1"],
  pin14: ["SHELL2"],
  pin15: ["SHELL3"],
  pin16: ["SHELL4"],
} as const

const PowerSection = () => (
  <>
    <schematicsection name={section} />
    <connector
      name="J1"
      standard="usb_c"
      pinLabels={usbCPinLabels}
      footprint="pinrow16"
      schSectionName={section}
    />
    <SS34 name="D1" schSectionName={section} />
    <mosfet
      name="U2"
      channelType="p"
      mosfetMode="enhancement"
      manufacturerPartNumber="AO3401A"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3"]}
            pcbX="1.15mm"
            pcbY="-0.95mm"
            width="1mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.15mm"
            pcbY="0.95mm"
            width="1mm"
            height="0.8mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.15mm"
            pcbY="0mm"
            width="1mm"
            height="0.8mm"
            shape="rect"
          />
        </footprint>
      }
      supplierPartNumbers={{ jlcpcb: ["C15127"] }}
      schSectionName={section}
    />
    <resistor
      name="U1"
      resistance="100k"
      footprint={fp0603}
      schSectionName={section}
    />
    <MIC5219_3_3YM5_TR name="U3" schSectionName={section} />
    <capacitor
      name="C1"
      capacitance="10uF"
      footprint={fp0603}
      schSectionName={section}
    />
    <capacitor
      name="C2"
      capacitance="470pF"
      footprint={fp0603}
      schSectionName={section}
    />
    <capacitor
      name="C3"
      capacitance="2.2uF"
      polarized
      footprint="0805"
      schSectionName={section}
    />
    <capacitor
      name="C4"
      capacitance="10uF"
      footprint={fp0603}
      schSectionName={section}
    />
    <led name="LED1" color="red" footprint={fp0603} schSectionName={section} />
    <resistor
      name="R1"
      resistance="470"
      footprint={fp0603}
      schSectionName={section}
    />
    <K3_1280S_F1 name="SW1" schSectionName={section} pcbX="30mm" pcbY="-26mm" />
    <resistor
      name="R2"
      resistance="100k"
      footprint={fp0603}
      schSectionName={section}
    />

    <trace from=".J1 > .VBUS1" to="net.V5" />
    <trace from=".J1 > .VBUS2" to="net.V5" />
    <trace from=".J1 > .GND1" to="net.GND" />
    <trace from=".J1 > .GND2" to="net.GND" />
    <trace from=".J1 > .SHELL1" to="net.GND" />
    <trace from=".J1 > .SHELL2" to="net.GND" />
    <trace from=".J1 > .SHELL3" to="net.GND" />
    <trace from=".J1 > .SHELL4" to="net.GND" />
    <trace from=".J1 > .DP1" to="net.DP" />
    <trace from=".J1 > .DP2" to="net.DP" />
    <trace from=".J1 > .DM1" to="net.DM" />
    <trace from=".J1 > .DM2" to="net.DM" />
    <trace from=".D1 > .cathode" to="net.VBUS" />
    <trace from=".D1 > .anode" to="net.V5" />
    <trace from=".U2 > .pin2" to="net.VBUS" />
    <trace from=".U2 > .pin1" to="net.BATT" />
    <trace from=".U2 > .pin3" to="net.V5" />
    <trace from="net.V5" to=".U1 > .pin1" />
    <trace from=".U1 > .pin2" to="net.GND" />
    <trace from=".U3 > .IN" to="net.VBUS" />
    <trace from=".U3 > .EN" to="net.LDO_EN" />
    <trace from=".U3 > .GND" to="net.GND" />
    <trace from=".U3 > .OUT" to="net.V3V3" />
    <trace from=".U3 > .BYP" to=".C2 > .pin1" />
    <trace from=".C1 > .pin1" to="net.VBUS" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".C2 > .pin2" to="net.GND" />
    <trace from=".C3 > .pin1" to="net.V3V3" />
    <trace from=".C3 > .pin2" to="net.GND" />
    <trace from=".C4 > .pin1" to="net.V3V3" />
    <trace from=".C4 > .pin2" to="net.GND" />
    <trace from="net.V3V3" to=".R1 > .pin2" />
    <trace from=".R1 > .pin1" to=".LED1 > .cathode" />
    <trace from=".LED1 > .anode" to="net.GND" />
    <trace from="net.VBUS" to=".R2 > .pin1" />
    <trace from=".R2 > .pin2" to="net.LDO_H" />
    <trace from=".SW1 > .pin1" to="net.GND" />
    <trace from=".SW1 > .pin2" to="net.LDO_EN" />
    <trace from=".SW1 > .pin3" to="net.LDO_H" />
  </>
)

test("repro161: PowerSection retains a readable auto-layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      routingDisabled
      schAutoLayoutEnabled
      schTraceAutoLabelEnabled
      schMaxTraceDistance="8mm"
    >
      <PowerSection />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.selectOne(".J1")?.selectAll("port")).toHaveLength(16)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
