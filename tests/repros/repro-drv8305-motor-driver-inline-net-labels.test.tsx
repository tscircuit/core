import { expect, test } from "bun:test"
import type { ChipProps, MosfetProps } from "@tscircuit/props"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const bat54PinLabels = {
  pin1: ["A12"],
  pin2: ["A11"],
  pin3: ["C2"],
  pin4: ["A21"],
  pin5: ["A22"],
  pin6: ["C1"],
} as const

const BAT54CDW_7_F = (props: ChipProps<typeof bat54PinLabels>) => {
  return (
    <chip
      pinLabels={bat54PinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C134406"],
      }}
      manufacturerPartNumber="BAT54CDW-7-F"
      footprint="dfn6_p0.65mm_w2.6998mm_pw0.4mm_pl0.9mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C134406.obj?uuid=c48363a009b446bc89c236a3f3be363d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C134406.step?uuid=c48363a009b446bc89c236a3f3be363d",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: 0.0001015999999935957,
          y: 0.00008889999999439624,
          z: 0,
        },
      }}
      {...props}
    />
  )
}

const drv8305PinLabels = {
  pin1: ["EN_GATE"],
  pin2: ["INHA"],
  pin3: ["INLA"],
  pin4: ["INHB"],
  pin5: ["INLB"],
  pin6: ["INHC"],
  pin7: ["INLC"],
  pin8: ["nFAULT"],
  pin9: ["nSCS"],
  pin10: ["SDI"],
  pin11: ["SDO"],
  pin12: ["SCLK"],
  pin13: ["PWRGD"],
  pin14: ["GND3"],
  pin15: ["AVDD"],
  pin16: ["SO1"],
  pin17: ["SO2"],
  pin18: ["SO3"],
  pin19: ["SN3"],
  pin20: ["SP3"],
  pin21: ["SN2"],
  pin22: ["SP2"],
  pin23: ["SN1"],
  pin24: ["SP1"],
  pin25: ["GLC"],
  pin26: ["SLC"],
  pin27: ["SHC"],
  pin28: ["GHC"],
  pin29: ["GHB"],
  pin30: ["SHB"],
  pin31: ["SLB"],
  pin32: ["GLB"],
  pin33: ["GLA"],
  pin34: ["SLA"],
  pin35: ["SHA"],
  pin36: ["GHA"],
  pin37: ["VCP_LSD"],
  pin38: ["VCPH"],
  pin39: ["CP2H"],
  pin40: ["CP2L"],
  pin41: ["PVDD"],
  pin42: ["CP1L"],
  pin43: ["CP1H"],
  pin44: ["VDRAIN"],
  pin45: ["GND2"],
  pin46: ["DVDD"],
  pin47: ["WAKE"],
  pin48: ["VREG"],
  pin49: ["PAD", "GND1"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin2: { requiresPower: true },
  pin3: { requiresPower: true },
  pin4: { requiresPower: true },
  pin5: { requiresPower: true },
  pin6: { requiresPower: true },
  pin7: { requiresPower: true },
  pin9: { requiresPower: true },
  pin10: { requiresPower: true },
  pin11: { providesPower: true },
  pin12: { requiresPower: true },
  pin16: { providesPower: true },
  pin17: { providesPower: true },
  pin18: { providesPower: true },
  pin19: { requiresPower: true },
  pin20: { requiresPower: true },
  pin21: { requiresPower: true },
  pin22: { requiresPower: true },
  pin23: { requiresPower: true },
  pin24: { requiresPower: true },
  pin25: { providesPower: true },
  pin26: { requiresPower: true },
  pin27: { requiresPower: true },
  pin28: { providesPower: true },
  pin29: { providesPower: true },
  pin30: { requiresPower: true },
  pin31: { requiresPower: true },
  pin32: { providesPower: true },
  pin33: { providesPower: true },
  pin34: { requiresPower: true },
  pin35: { requiresPower: true },
  pin36: { providesPower: true },
  pin47: { requiresPower: true },
} satisfies NonNullable<ChipProps["pinAttributes"]>

const footprinterPinLabels = {
  ...drv8305PinLabels,
  pin49: [...drv8305PinLabels.pin49, "thermalpad"],
} as const

// JLCPCB C701115 is TI's PHP0048G (HTQFP-48/PowerPAD) package. This matches
// TI's recommended land pattern: 7 mm body, 0.5 mm pitch, 1.6 x 0.3 mm
// signal pads, and a 5.1 mm square exposed PowerPAD.
const php0048gFootprint =
  "tqfp48_thermalpad5.1mmx5.1mm_p0.5mm_w7mm_h7mm_pw0.3mm_pl1.6mm_pin1location(bottomside,left)"

const DRV83053QPHPQ1 = (props: ChipProps<typeof drv8305PinLabels>) => (
  <chip
    pinLabels={footprinterPinLabels}
    pinAttributes={pinAttributes}
    supplierPartNumbers={{ jlcpcb: ["C701115"] }}
    manufacturerPartNumber="DRV83053QPHPQ1"
    footprint={php0048gFootprint}
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C701115.obj?uuid=f0220855bd3041998a0835a0b1f707e8",
      stepUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/assets/C701115.step?uuid=f0220855bd3041998a0835a0b1f707e8",
      pcbRotationOffset: 0,
      modelOriginPosition: { x: 0, y: 0, z: -0.6 },
    }}
    {...props}
  />
)

type SQJ858AEPProps = Omit<
  MosfetProps,
  "channelType" | "mosfetMode" | "footprint"
>

const SQJ858AEP_T1_GE3 = (props: SQJ858AEPProps) => {
  return (
    <mosfet
      channelType="n"
      mosfetMode="enhancement"
      supplierPartNumbers={{
        jlcpcb: ["C143688"],
      }}
      manufacturerPartNumber="SQJ858AEP-T1-GE3"
      footprint={
        <footprint>
          {/* Package pins 1, 2 and 3 are the common source terminal. */}
          <smtpad
            portHints={["source", "pin2"]}
            pcbX="2.85496635mm"
            pcbY="-0.635mm"
            width="1.149985mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["source", "pin2"]}
            pcbX="2.85014035mm"
            pcbY="-1.905mm"
            width="1.149985mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["source", "pin2"]}
            pcbX="2.85496635mm"
            pcbY="0.635mm"
            width="1.149985mm"
            height="0.6999986mm"
            shape="rect"
          />
          {/* Package pin 4 is gate; the exposed 5-8 pad is drain. */}
          <smtpad
            portHints={["gate", "pin3"]}
            pcbX="2.85014035mm"
            pcbY="1.905mm"
            width="1.149985mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["drain", "pin1"]}
            points={[
              { x: "-3.42995885mm", y: "2.3999952mm" },
              { x: "-3.42995885mm", y: "-2.3999952mm" },
              { x: "-1.77997485mm", y: "-2.3999952mm" },
              { x: "-1.77997485mm", y: "-2.1500084mm" },
              { x: "1.27003175mm", y: "-2.1500084mm" },
              { x: "1.27003175mm", y: "2.149983mm" },
              { x: "-1.77997485mm", y: "2.149983mm" },
              { x: "-1.77997485mm", y: "2.3999952mm" },
            ]}
            shape="polygon"
          />
          <silkscreenpath
            route={[
              { x: -1.97997445, y: -2.5999948 },
              { x: -1.96595365, y: -2.60096 },
              { x: 2.33426635, y: -2.60096 },
              { x: 2.33426635, y: -2.4003 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.33426635, y: 2.4003 },
              { x: 2.33426635, y: 2.60096 },
              { x: -1.96595365, y: 2.60096 },
              { x: -1.92996185, y: 2.5999948 },
            ]}
          />
          <silkscreencircle
            pcbX="2.81991435mm"
            pcbY="-2.599944mm"
            radius="0.070866mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.01016635mm"
            pcbY="3.61112mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.66883365, y: 2.86112 },
              { x: 3.68916635, y: 2.86112 },
              { x: 3.68916635, y: -2.92208 },
              { x: -3.66883365, y: -2.92208 },
              { x: -3.66883365, y: 2.86112 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C143688.obj?uuid=ceedb41b879045b6b150513b341eb93b",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C143688.step?uuid=ceedb41b879045b6b150513b341eb93b",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.1859880499999993,
          y: 0.000012699999999199463,
          z: 0,
        },
      }}
      {...props}
    />
  )
}

const NetTie = ({
  name,
  schX,
  schY,
}: {
  name: string
  schX: number
  schY: number
}) => (
  <jumper
    name={name}
    pinCount={2}
    schX={schX}
    schY={schY}
    schWidth={0.45}
    schHeight={0.25}
    schPinArrangement={{
      leftSide: { pins: [1], direction: "top-to-bottom" },
      rightSide: { pins: [2], direction: "top-to-bottom" },
    }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.127mm"
          pcbY="0mm"
          width="0.254mm"
          height="0.254mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0.127mm"
          pcbY="0mm"
          width="0.254mm"
          height="0.254mm"
          shape="rect"
        />
      </footprint>
    }
  />
)

/**
 * Motor-driver section extracted from TIDA-01330 sheet 2.
 *
 * Scope: U1, its required local support networks, the current-sense output
 * protection, three SQJ858AEP half-bridges, Kelvin-connected current shunts
 * and the motor connector. The upstream input protection/filter and the
 * LaunchPad/demo interface circuitry are intentionally outside this block.
 */
export const MotorDriver_DRV8305_TIDA01330 = () => (
  <board
    title="TIDA-01330 motor-driver reference subcircuit"
    routingDisabled
    schMaxTraceDistance="4mm"
  >
    <net name="GND" isGroundNet />
    <net name="PVDD" isPowerNet />

    <DRV83053QPHPQ1
      name="U1"
      schX={0}
      schY={0}
      schWidth={2.43}
      schHeight={13.0}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [
            15, 46, 41, 8, 12, 10, 11, 9, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 37,
            38,
          ],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [
            43, 42, 39, 40, 47, 48, 13, 44, 36, 35, 33, 34, 29, 31, 32, 30, 28,
            27, 25, 26, 23, 24, 21, 22, 19, 20, 14, 45, 49,
          ],
        },
      }}
      schPinStyle={{
        pin15: { marginBottom: 0.4 },
        pin46: { marginBottom: 0.4 },
        pin41: { marginBottom: 0.2 },
        pin8: { marginBottom: 0.1 },
        pin12: { marginBottom: 0.1 },
        pin10: { marginBottom: 0.1 },
        pin11: { marginBottom: 0.1 },
        pin9: { marginBottom: 0.1 },
        pin1: { marginBottom: 0.4 },
        pin2: { marginBottom: 0.4 },
        pin3: { marginBottom: 0.8 },
        pin4: { marginBottom: 0.4 },
        pin5: { marginBottom: 0.8 },
        pin6: { marginBottom: 0.4 },
        pin7: { marginBottom: 1.8 },
        pin16: { marginBottom: 0.4 },
        pin17: { marginBottom: 0.4 },
        pin18: { marginBottom: 0.6 },
        pin37: { marginBottom: 0.4 },
        pin43: { marginBottom: 0.4 },
        pin42: { marginBottom: 0.4 },
        pin39: { marginBottom: 0.25 },
        pin40: { marginBottom: 0.1 },
        pin47: { marginBottom: 0.1 },
        pin48: { marginBottom: 0.1 },
        pin13: { marginBottom: 0.1 },
        pin44: { marginBottom: 0.7 },
        pin36: { marginBottom: 0.4 },
        pin35: { marginBottom: 0.1 },
        pin33: { marginBottom: 0.1 },
        pin34: { marginBottom: 0.2 },
        pin29: { marginBottom: 0.4 },
        pin31: { marginBottom: 0.1 },
        pin32: { marginBottom: 0.1 },
        pin30: { marginBottom: 0.2 },
        pin28: { marginBottom: 0.4 },
        pin27: { marginBottom: 0.2 },
        pin25: { marginBottom: 0.2 },
        pin26: { marginBottom: 0.3 },
        pin23: { marginBottom: 0.2 },
        pin24: { marginBottom: 0.3 },
        pin21: { marginBottom: 0.2 },
        pin22: { marginBottom: 0.3 },
        pin19: { marginBottom: 0.2 },
        pin20: { marginBottom: 0.3 },
        pin14: { marginBottom: 0.1 },
        pin45: { marginBottom: 0.1 },
      }}
    />

    {/* AVDD, DVDD and PVDD bypassing, placed as in the reference. */}
    <capacitor
      name="C14"
      capacitance="1uF"
      manufacturerPartNumber="C1608X7R1C105K080AC"
      footprint="0603"
      schX={-5.2}
      schY={5.6}
      schOrientation="vertical"
    />
    <capacitor
      name="C16"
      capacitance="1uF"
      manufacturerPartNumber="C1608X7R1C105K080AC"
      footprint="0603"
      schX={-4.1}
      schY={5.0}
      schOrientation="vertical"
    />
    <capacitor
      name="C17"
      capacitance="4.7uF"
      manufacturerPartNumber="GRM31CR71H475KA12L"
      footprint="1206"
      schX={-3.3}
      schY={4.4}
      schOrientation="vertical"
    />
    <trace from=".U1 > .AVDD" to=".C14 > .pin1" />
    <trace from=".U1 > .AVDD" to="net.AVDD" schDisplayLabel="AVDD" />
    <trace from=".U1 > .DVDD" to=".C16 > .pin1" />
    <trace from=".U1 > .DVDD" to="net.DVDD" schDisplayLabel="DVDD" />
    <trace from=".U1 > .PVDD" to=".C17 > .pin1" />
    <trace from=".U1 > .PVDD" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".C14 > .pin2" to=".C16 > .pin2" />
    <trace from=".C16 > .pin2" to=".C17 > .pin2" />
    <trace from=".C14 > .pin2" to="net.GND" schDisplayLabel="GND" />

    {/* Charge-pump flying capacitors. */}
    {/*
     * The SchDoc displays 0.047uF but embeds GRM188R72A104KA35D, which is a
     * 0.10uF part. Preserve the displayed reference value without a false MPN.
     */}
    <capacitor
      name="C13"
      capacitance="0.047uF"
      footprint="0603"
      schX={2.8}
      schY={6.07}
      schOrientation="horizontal"
    />
    <capacitor
      name="C15"
      capacitance="0.047uF"
      footprint="0603"
      schX={2.8}
      schY={4.87}
      schOrientation="horizontal"
    />
    <trace from=".U1 > .CP1H" to=".C13 > .pin1" />
    <trace from=".U1 > .CP1L" to=".C13 > .pin2" />
    <trace from=".U1 > .CP2H" to=".C15 > .pin1" />
    <trace from=".U1 > .CP2L" to=".C15 > .pin2" />

    {/* PWRGD/reset and VDRAIN networks. */}
    <resistor
      name="R7"
      resistance="56ohm"
      manufacturerPartNumber="CRCW040256R0JNED"
      footprint="0402"
      schX={3.5}
      schY={3.4}
    />
    <resistor
      name="R8"
      resistance="100ohm"
      manufacturerPartNumber="CRCW0402100RFKED"
      footprint="0402"
      schX={3.0}
      schY={2.6}
    />
    <capacitor
      name="C18"
      capacitance="1uF"
      manufacturerPartNumber="C1608X7R1C105K080AC"
      footprint="0603"
      schX={5.0}
      schY={3}
      schOrientation="vertical"
    />
    {/* <schematicsymbol
      name="V3V3_RESET"
      displayName="3p3V"
      symbolName="rail_up"
      schX={5.0}
      schY={4.2}
    /> */}
    <trace
      name="PWRGD"
      from=".U1 > .PWRGD"
      to="net.PWRGD"
      schDisplayLabel="PWRGD"
    />
    <trace from=".R7 > .pin1" to="net.PWRGD" />
    <trace from=".R7 > .pin2" to="net.nRESET" schDisplayLabel="nRESET" />
    {/* <trace from=".R7 > .pin2" to=".C18 > .pin1" /> */}
    <trace from=".C18 > .pin1" to="net.V3p3" schDisplayLabel="3p3V" />
    <trace from=".U1 > .VREG" to=".C18 > .pin1" />
    <trace from=".C18 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".U1 > .VDRAIN" to=".R8 > .pin1" />
    <trace from=".R8 > .pin2" to="net.PVDD" schDisplayLabel="PVDD" />

    {/* Current-amplifier output filters. */}
    <resistor
      name="R14"
      resistance="56ohm"
      manufacturerPartNumber="CRCW040256R0JNED"
      footprint="0402"
      schX={-4}
      schY={-3.4}
    />
    <resistor
      name="R15"
      resistance="56ohm"
      manufacturerPartNumber="CRCW040256R0JNED"
      footprint="0402"
      schX={-4}
      schY={-4.1}
    />
    <resistor
      name="R16"
      resistance="56ohm"
      manufacturerPartNumber="CRCW040256R0JNED"
      footprint="0402"
      schX={-4}
      schY={-4.8}
    />
    <capacitor
      name="C22"
      capacitance="2200pF"
      manufacturerPartNumber="GRM188R71C222KA01D"
      footprint="0603"
      schX={-7}
      schY={-6.2}
      schOrientation="vertical"
    />
    <capacitor
      name="C23"
      capacitance="2200pF"
      manufacturerPartNumber="GRM188R71C222KA01D"
      footprint="0603"
      schX={-6}
      schY={-6.2}
      schOrientation="vertical"
    />
    <capacitor
      name="C24"
      capacitance="2200pF"
      manufacturerPartNumber="GRM188R71C222KA01D"
      footprint="0603"
      schX={-5.1}
      schY={-6.2}
      schOrientation="vertical"
    />
    <trace from=".U1 > .SO1" to=".R14 > .pin2" />
    <trace from=".U1 > .SO2" to=".R15 > .pin2" />
    <trace from=".U1 > .SO3" to=".R16 > .pin2" />
    <trace from=".R14 > .pin1" to="net.ISNS_A" schDisplayLabel="ISNS_A" />
    <trace from=".R15 > .pin1" to="net.ISNS_B" schDisplayLabel="ISNS_B" />
    <trace from=".R16 > .pin1" to="net.ISNS_C" schDisplayLabel="ISNS_C" />
    <trace from=".R14 > .pin1" to=".C22 > .pin1" />
    <trace from=".R15 > .pin1" to=".C23 > .pin1" />
    <trace from=".R16 > .pin1" to=".C24 > .pin1" />
    <trace from=".C22 > .pin2" to=".C23 > .pin2" />
    <trace from=".C23 > .pin2" to=".C24 > .pin2" />
    <trace from=".C24 > .pin2" to=".C26 > .pin2" />

    {/* Schottky clamps protecting the three current-sense outputs. */}
    <BAT54CDW_7_F
      name="D4"
      schX={-15}
      schY={-4.85}
      schWidth={1.85}
      schHeight={2.3}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1, 2, 3],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [6, 5, 4],
        },
      }}
    />
    <trace from=".D4 > .pin1" to="net.ISNS_B" schDisplayLabel="ISNS_B" />
    <trace from=".D4 > .pin2" to="net.ISNS_A" schDisplayLabel="ISNS_A" />
    <trace from=".D4 > .pin3" to="net.V3p3" schDisplayLabel="3p3V" />
    <trace from=".D4 > .pin5" to="net.ISNS_C" schDisplayLabel="ISNS_C" />
    <trace from=".D4 > .pin6" to="net.V3p3" schDisplayLabel="3p3V" />

    {/* Low-side and main charge-pump reservoirs. */}
    <capacitor
      name="C26"
      capacitance="1uF"
      manufacturerPartNumber="C1608X7R1C105K080AC"
      footprint="0603"
      schX={-3.9}
      schY={-6.3}
      schOrientation="vertical"
    />
    <capacitor
      name="C27"
      capacitance="2.2uF"
      manufacturerPartNumber="GRM32ER72A225KA35L"
      footprint="1210"
      schX={-2.4}
      schY={-6.05}
    />
    <trace from=".U1 > .VCP_LSD" to=".C26 > .pin1" />
    <trace from=".C26 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace
      name="VCPH"
      from=".U1 > .VCPH"
      to="net.VCPH"
      schDisplayLabel="VCPH"
    />
    <trace from=".C27 > .pin2" to="net.VCPH" />
    <trace from=".C27 > .pin1" to="net.PVDD" schDisplayLabel="PVDD" />

    {/* Differential shunt-input filters. */}
    <capacitor
      name="C20"
      capacitance="1000pF"
      manufacturerPartNumber="GRM188R71C102KA01D"
      footprint="0603"
      schX={3.5}
      schY={-2.5}
      schOrientation="vertical"
    />
    <capacitor
      name="C21"
      capacitance="1000pF"
      manufacturerPartNumber="GRM188R71C102KA01D"
      footprint="0603"
      schX={3.5}
      schY={-3.8}
      schOrientation="vertical"
    />
    <capacitor
      name="C25"
      capacitance="1000pF"
      manufacturerPartNumber="GRM188R71C102KA01D"
      footprint="0603"
      schX={3.5}
      schY={-5.2}
      schOrientation="vertical"
    />
    <trace from=".U1 > .SN1" to=".C20 > .pin1" />
    <trace from=".U1 > .SP1" to=".C20 > .pin2" />
    <trace from=".U1 > .SN2" to=".C21 > .pin1" />
    <trace from=".U1 > .SP2" to=".C21 > .pin2" />
    <trace from=".U1 > .SN3" to=".C25 > .pin1" />
    <trace from=".U1 > .SP3" to=".C25 > .pin2" />
    <trace from=".C20 > .pin1" to="net.S1_N" />
    <trace from=".C20 > .pin2" to="net.S1_P" />
    <trace from=".C21 > .pin1" to="net.S2_N" />
    <trace from=".C21 > .pin2" to="net.S2_P" />
    <trace from=".C25 > .pin1" to="net.S3_N" />
    <trace from=".C25 > .pin2" to="net.S3_P" />

    {/* U1 ground pins. */}
    <trace from=".U1 > .GND3" to=".U1 > .GND2" />
    <trace from=".U1 > .GND2" to=".U1 > .GND1" />
    <trace from=".U1 > .GND1" to="net.GND" schDisplayLabel="GND" />

    {/* Left-side control and current-sense boundary nets. */}
    <trace from=".U1 > .nFAULT" to="net.nFAULT" />
    <trace from=".U1 > .SCLK" to="net.TILT_P" schDisplayLabel="TILT+" />
    <trace from=".U1 > .SDI" to="net.BACK" />
    <trace from=".U1 > .SDO" to="net.FWD" />
    <trace from=".U1 > .nSCS" to="net.nCS" schDisplayLabel="nCS" />
    <trace from=".U1 > .EN_GATE" to="net.EN_GATE" />
    <trace from=".U1 > .INHA" to="net.AH" />
    <trace from=".U1 > .INLA" to="net.AL" />
    <trace from=".U1 > .INHB" to="net.BH" />
    <trace from=".U1 > .INLB" to="net.BL" />
    <trace from=".U1 > .INHC" to="net.CH" />
    <trace from=".U1 > .INLC" to="net.CL" />

    {/* Gate-driver outputs retain the Altium net names used by the bridges. */}
    <trace from=".U1 > .WAKE" to="net.WAKE" />
    <trace from=".U1 > .GHA" to="net.GH_A" />
    <trace
      name="MOT_A"
      from=".U1 > .SHA"
      to="net.MOT_A"
      schDisplayLabel="MOT_A"
    />
    <trace from=".U1 > .GLA" to="net.GL_A" />
    <trace from=".U1 > .SLA" to="net.SL_A" />
    <trace from=".U1 > .GHB" to="net.GH_B" />
    <trace from=".U1 > .SLB" to="net.SL_B" />
    <trace from=".U1 > .GLB" to="net.GL_B" />
    <trace
      name="MOT_B"
      from=".U1 > .SHB"
      to="net.MOT_B"
      schDisplayLabel="MOT_B"
    />
    <trace from=".U1 > .GHC" to="net.GH_C" />
    <trace
      name="MOT_C"
      from=".U1 > .SHC"
      to="net.MOT_C"
      schDisplayLabel="MOT_C"
    />
    <trace from=".U1 > .GLC" to="net.GL_C" />
    <trace from=".U1 > .SLC" to="net.SL_C" />

    {/* Phase A half-bridge, shunt and Kelvin sense connections. */}
    <capacitor
      name="C1"
      capacitance="1uF"
      manufacturerPartNumber="UMK107AB7105KA-T"
      footprint="0603"
      schX={12.9}
      schY={14.7}
      schOrientation="vertical"
    />
    <SQJ858AEP_T1_GE3
      name="Q2"
      schX={14.25}
      schY={14.25}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <SQJ858AEP_T1_GE3
      name="Q4"
      schX={14.25}
      schY={12.42}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <resistor
      name="R6"
      resistance="0.015ohm"
      manufacturerPartNumber="CRA2512-FZ-R015ELF"
      footprint="2512"
      schX={14.7}
      schY={9.65}
      schOrientation="vertical"
    />
    <NetTie name="NT1" schX={13.0} schY={10.1} />
    <NetTie name="NT2" schX={13.0} schY={9.2} />
    <trace from=".C1 > .pin1" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".C1 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".Q2 > .drain" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".Q2 > .gate" to="net.GH_A" schDisplayLabel="GH_A" />
    <trace from=".Q2 > .source" to=".Q4 > .drain" />
    <trace
      name="MOT_A"
      from=".Q2 > .source"
      to="net.MOT_A"
      schDisplayLabel="MOT_A"
    />
    <trace from=".Q4 > .gate" to="net.GL_A" schDisplayLabel="GL_A" />
    <trace from=".Q4 > .source" to=".R6 > .pin1" />
    <trace from=".Q4 > .source" to="net.SL_A" schDisplayLabel="SL_A" />
    <trace from=".R6 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".NT1 > .pin1" to="net.S1_N" schDisplayLabel="S1_N" />
    <trace from=".NT1 > .pin2" to="net.SL_A" />
    <trace from=".NT2 > .pin1" to="net.S1_P" schDisplayLabel="S1_P" />
    <trace from=".NT2 > .pin2" to="net.GND" />

    {/* Phase B half-bridge, shunt and Kelvin sense connections. */}
    <capacitor
      name="C12"
      capacitance="1uF"
      manufacturerPartNumber="UMK107AB7105KA-T"
      footprint="0603"
      schX={10.58}
      schY={7.25}
      schOrientation="vertical"
    />
    <SQJ858AEP_T1_GE3
      name="Q6"
      schX={11.96}
      schY={6.9}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <SQJ858AEP_T1_GE3
      name="Q7"
      schX={11.96}
      schY={5.06}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <resistor
      name="R9"
      resistance="0.015ohm"
      manufacturerPartNumber="CRA2512-FZ-R015ELF"
      footprint="2512"
      schX={12.42}
      schY={2.3}
      schOrientation="vertical"
    />
    <NetTie name="NT3" schX={10.75} schY={2.75} />
    <NetTie name="NT4" schX={10.75} schY={1.85} />
    <trace from=".C12 > .pin1" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".C12 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".Q6 > .drain" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".Q6 > .gate" to="net.GH_B" />
    <trace from=".Q6 > .source" to=".Q7 > .drain" />
    <trace
      name="MOT_B"
      from=".Q6 > .source"
      to="net.MOT_B"
      schDisplayLabel="MOT_B"
    />
    <trace from=".Q7 > .gate" to="net.GL_B" schDisplayLabel="GL_B" />
    <trace from=".Q7 > .source" to=".R9 > .pin1" />
    <trace from=".Q7 > .source" to="net.SL_B" schDisplayLabel="SL_B" />
    <trace from=".R9 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".NT3 > .pin1" to="net.S2_N" schDisplayLabel="S2_N" />
    <trace from=".NT3 > .pin2" to="net.SL_B" />
    <trace from=".NT4 > .pin1" to="net.S2_P" schDisplayLabel="S2_P" />
    <trace from=".NT4 > .pin2" to="net.GND" />

    {/* Phase C half-bridge, shunt and Kelvin sense connections. */}
    <capacitor
      name="C19"
      capacitance="1uF"
      manufacturerPartNumber="UMK107AB7105KA-T"
      footprint="0603"
      schX={8.5}
      schY={-0.25}
      schOrientation="vertical"
    />
    <SQJ858AEP_T1_GE3
      name="Q8"
      schX={9.9}
      schY={-0.7}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <SQJ858AEP_T1_GE3
      name="Q9"
      schX={9.9}
      schY={-2.55}
      symbolDrainSide="top"
      symbolSourceSide="bottom"
      symbolGateSide="left"
    />
    <resistor
      name="R17"
      resistance="0.015ohm"
      manufacturerPartNumber="CRA2512-FZ-R015ELF"
      footprint="2512"
      schX={10.35}
      schY={-5.3}
      schOrientation="vertical"
    />
    <NetTie name="NT5" schX={8.7} schY={-4.85} />
    <NetTie name="NT6" schX={8.7} schY={-5.75} />
    <trace from=".C19 > .pin1" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".C19 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".Q8 > .drain" to="net.PVDD" schDisplayLabel="PVDD" />
    <trace from=".Q8 > .gate" to="net.GH_C" schDisplayLabel="GH_C" />
    <trace from=".Q8 > .source" to=".Q9 > .drain" />
    <trace
      name="MOT_C"
      from=".Q8 > .source"
      to="net.MOT_C"
      schDisplayLabel="MOT_C"
    />
    <trace from=".Q9 > .gate" to="net.GL_C" schDisplayLabel="GL_C" />
    <trace from=".Q9 > .source" to=".R17 > .pin1" />
    <trace from=".Q9 > .source" to="net.SL_C" schDisplayLabel="SL_C" />
    <trace from=".R17 > .pin2" to="net.GND" schDisplayLabel="GND" />
    <trace from=".NT5 > .pin1" to="net.S3_N" schDisplayLabel="S3_N" />
    <trace from=".NT5 > .pin2" to="net.SL_C" />
    <trace from=".NT6 > .pin1" to="net.S3_P" schDisplayLabel="S3_P" />
    <trace from=".NT6 > .pin2" to="net.GND" />

    {/* Two brushed-motor outputs, preserving the J5 pin order. */}
    <connector
      name="J5"
      pinCount={6}
      manufacturerPartNumber="1729160"
      schX={15.5}
      schY={-1.85}
      schWidth={0.5}
      schHeight={1.4}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1, 2, 3, 4, 5, 6],
        },
      }}
      footprint={
        <footprint insertionDirection="from_above">
          <platedhole
            portHints={["pin1"]}
            pcbX="-12.7mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="-7.62mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
          <platedhole
            portHints={["pin3"]}
            pcbX="-2.54mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
          <platedhole
            portHints={["pin4"]}
            pcbX="2.54mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
          <platedhole
            portHints={["pin5"]}
            pcbX="7.62mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
          <platedhole
            portHints={["pin6"]}
            pcbX="12.7mm"
            pcbY="0mm"
            shape="circle"
            holeDiameter="1.3mm"
            outerDiameter="2.5mm"
          />
        </footprint>
      }
    />
    <trace
      name="MOT_C"
      from=".J5 > .pin1"
      to="net.MOT_C"
      schDisplayLabel="MOT_C"
    />
    <trace
      name="MOT_B"
      from=".J5 > .pin2"
      to="net.MOT_B"
      schDisplayLabel="MOT_B"
    />
    <trace
      name="MOT_C"
      from=".J5 > .pin3"
      to="net.MOT_C"
      schDisplayLabel="MOT_C"
    />
    <trace
      name="MOT_A"
      from=".J5 > .pin4"
      to="net.MOT_A"
      schDisplayLabel="MOT_A"
    />
    <trace
      name="MOT_B"
      from=".J5 > .pin5"
      to="net.MOT_B"
      schDisplayLabel="MOT_B"
    />
    <trace
      name="MOT_A"
      from=".J5 > .pin6"
      to="net.MOT_A"
      schDisplayLabel="MOT_A"
    />
  </board>
)

export default MotorDriver_DRV8305_TIDA01330

const remoteSignalLabels = [
  "GH_B",
  "MOT_A",
  "MOT_B",
  "MOT_C",
  "S1_N",
  "S1_P",
  "S2_N",
  "S2_P",
  "S3_N",
  "S3_P",
  "SL_A",
  "SL_B",
  "SL_C",
]

test("DRV8305 motor-driver remote signal labels render inline", async () => {
  const { circuit } = getTestFixture()
  let solverInputProblem: InputProblem | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblem = event.solverParams as InputProblem
    }
  })

  circuit.add(<MotorDriver_DRV8305_TIDA01330 />)
  await circuit.renderUntilSettled()

  expect(solverInputProblem).toBeDefined()
  expect(solverInputProblem!.chips.length).toBeGreaterThan(20)

  const inlineRemoteSignalLabels = new Set(
    circuit.db.schematic_text
      .list()
      .filter((label) => remoteSignalLabels.includes(label.text))
      .map((label) => label.text),
  )

  expect(inlineRemoteSignalLabels).toEqual(new Set(remoteSignalLabels))
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => remoteSignalLabels.includes(label.text)),
  ).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 120_000)
