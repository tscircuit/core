import { modelFor } from "./jlc-adapters"
import React from "react"
import {
  IC,
  R,
  C,
  Diode,
  NMOS,
  pcbPlacement,
  Title,
  Note,
  UsbC,
  ESD,
  Wire,
  efusePins,
  pins,
} from "./parts"
import powerInductor from "../library/footprints/L_PWR.json"
export function MotorPowerChannel({
  channel,
  x,
}: {
  channel: number
  x: number
}) {
  const b = channel * 100
  const n = (s: string) => `M${channel}_${s}`
  const ref = (t: string, i: number) => `${t}${b + i}`
  const pos = (px: number, py: number, sx: number, sy: number) => ({
    pcbX: x + px,
    pcbY: -20 + py,
    schX: sx,
    schY: sy,
  })
  const controller = ref("U", 1),
    pd = ref("U", 2),
    fuse = ref("U", 3)
  const lmPins = { ...pins.LM5176PWP, 13: "ISNS_N", 14: "ISNS_P" }
  const lmCon = {
    1: n("BUCK_EN"),
    2: n("VIN_IC"),
    3: "VIN20",
    4: n("MODE"),
    5: "GND",
    6: n("RT"),
    7: n("SLOPE"),
    8: n("SS"),
    9: n("COMP"),
    10: "GND",
    11: n("FB"),
    12: n("REG"),
    13: n("REG"),
    14: n("REG"),
    15: n("CSG"),
    16: n("CS"),
    17: n("PGOOD"),
    18: n("SW2"),
    19: n("HG2"),
    20: n("BOOT2"),
    21: n("LG2"),
    22: "GND",
    23: n("VCC"),
    24: n("REG"),
    25: n("LG1"),
    26: n("BOOT1"),
    27: n("HG1"),
    28: n("SW1"),
    29: "GND",
  }
  const pdPins = {
    1: "VDD",
    2: "CC1",
    3: "CC2",
    4: "SCL",
    5: "SDA",
    6: "GND",
    7: "SEL_PDO3",
    8: "SEL_PDO2",
    9: "ADDR0",
    10: "SEL_PDO4",
    11: "SEL_PDO5",
    12: "VBUS_SENSE",
    13: "VBUS_DISCH",
    14: "VBUS_EN_SRC_N",
    15: "VREG_1V2",
    16: "VREG_2V7",
  }
  // ST selector pins ground one tap of this ladder. Default feedback = 5 V.
  // LM5176 Vref=0.8 V; Rtop=100k; cumulative Rbottom: 4.12k/5.62k/7.12k/9.73k/19.04k.
  return (
    <>
      <schematicsheet
        name={`motor${channel}_converter`}
        displayName={`M${channel} / 4-switch buck-boost`}
      >
        <Title
          text={`M${channel} — BUCK-BOOST  |  5 V default; 9 / 12 / 15 / 20 V negotiated`}
          x={12}
          y={23.5}
        />
        <IC
          name={controller}
          mpn="LM5176PWPR"
          pinNames={lmPins}
          connections={lmCon}
          {...pos(0, -6, -4, 1)}
          width={7}
          left={[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "29",
          ]}
          right={[
            "28",
            "27",
            "26",
            "25",
            "24",
            "23",
            "22",
            "21",
            "20",
            "19",
            "18",
            "17",
            "16",
            "15",
            "14",
            "13",
          ]}
        />
        <NMOS
          name={ref("Q", 1)}
          g={n("HG1")}
          d="VIN20"
          s={n("SW1")}
          {...pos(-5, 10, 11, 14)}
        />
        <NMOS
          name={ref("Q", 2)}
          g={n("LG1")}
          d={n("SW1")}
          s={n("CS_RAW")}
          {...pos(-5, 2, 11, 5)}
        />
        <NMOS
          name={ref("Q", 3)}
          g={n("HG2")}
          d={n("REG")}
          s={n("SW2")}
          {...pos(5, 10, 26, 14)}
        />
        <NMOS
          name={ref("Q", 4)}
          g={n("LG2")}
          d={n("SW2")}
          s={n("CS_RAW")}
          {...pos(5, 2, 26, 5)}
        />
        <inductor
          name={ref("L", 1)}
          {...modelFor("SRP1038A-4R7M")}
          inductance="4.7uH"
          {...pos(0, 18, 19, 10)}
          {...pcbPlacement(ref("L", 1))}
          schX={19 * 0.38}
          schY={10 * 0.45}
        />
        <Wire from={`${ref("L", 1)}.pin1`} to={n("SW1")} width={1.5} />
        <Wire from={`${ref("L", 1)}.pin2`} to={n("SW2")} width={1.5} />
        <R
          name={ref("R", 1)}
          value="0.008"
          a={n("CS_RAW")}
          b="GND"
          footprint="2512"
          {...pos(8, -5, 26, -4)}
        />
        <R
          name={ref("R", 2)}
          value="100"
          a={n("CS_RAW")}
          b={n("CS")}
          {...pos(6, -11, 18, -6)}
        />
        <R
          name={ref("R", 3)}
          value="100"
          a="GND"
          b={n("CSG")}
          {...pos(6, -13, 18, -9)}
        />
        <C
          name={ref("C", 1)}
          value="47pF"
          a={n("CS")}
          b={n("CSG")}
          {...pos(3, -12, 9, -11)}
        />
        <C
          name={ref("C", 2)}
          value="100nF"
          a={n("BOOT1")}
          b={n("SW1")}
          {...pos(-9, 7, 11, 20)}
        />
        <C
          name={ref("C", 3)}
          value="100nF"
          a={n("BOOT2")}
          b={n("SW2")}
          {...pos(9, 7, 26, 20)}
        />
        <Diode
          name={ref("D", 1)}
          a={n("VCC")}
          k={n("BOOT1")}
          {...pos(-9, 3, 3, 20)}
        />
        <Diode
          name={ref("D", 2)}
          a={n("VCC")}
          k={n("BOOT2")}
          {...pos(9, 3, 34, 20)}
        />
        <R
          name={ref("R", 4)}
          value="10"
          a="VIN20"
          b={n("VIN_IC")}
          {...pos(-9, -1, -17, 12)}
        />
        <C
          name={ref("C", 4)}
          value="100nF"
          a={n("VIN_IC")}
          {...pos(-9, -3, -17, 9)}
        />
        <C
          name={ref("C", 5)}
          value="1uF"
          a={n("VCC")}
          {...pos(-8, -9, -17, 6)}
        />
        <C
          name={ref("C", 6)}
          value="100nF"
          a={n("REG")}
          {...pos(9, -9, -17, 3)}
        />
        <R
          name={ref("R", 5)}
          value="93.1k"
          a={n("MODE")}
          b="GND"
          {...pos(-8, -12, -17, 0)}
        />
        <R
          name={ref("R", 6)}
          value="27.4k"
          a={n("RT")}
          b="GND"
          {...pos(-8, -14, -17, -3)}
        />
        <C
          name={ref("C", 7)}
          value="220pF"
          a={n("SLOPE")}
          {...pos(-5, -12, -17, -6)}
        />
        <C
          name={ref("C", 8)}
          value="100nF"
          a={n("SS")}
          {...pos(-5, -14, -17, -9)}
        />
        <R
          name={ref("R", 7)}
          value="100k"
          a={n("BUCK_EN")}
          b="GND"
          {...pos(-8, -6, -17, -12)}
        />
        <R
          name={ref("R", 8)}
          value="10k"
          a="SYS3V3"
          b={n("PGOOD")}
          {...pos(5, -16, 30, -10)}
        />
        <C
          name={ref("C", 9)}
          value="560pF"
          a={n("COMP")}
          {...pos(-2, -13, -8, -15)}
        />
        <C
          name={ref("C", 10)}
          value="33nF"
          a={n("COMP")}
          b={n("COMP_RC")}
          {...pos(-2, -15, 1, -15)}
        />
        <R
          name={ref("R", 9)}
          value="10k"
          a={n("COMP_RC")}
          b="GND"
          {...pos(1, -15, 10, -15)}
        />
        {[0, 1].map((i) => (
          <C
            key={i}
            name={ref("C", 11 + i)}
            value="22uF"
            a="VIN20"
            footprint="1210"
            {...pos(-8 + i * 4, 18, 38, 14 - i * 4)}
          />
        ))}
        {[0, 1].map((i) => (
          <C
            key={i}
            name={ref("C", 13 + i)}
            value="47uF"
            a={n("REG")}
            footprint="1210"
            {...pos(5 + i * 4, 18, 38, 5 - i * 4)}
          />
        ))}
        <Note
          text="Power-stage values start from TI LM5176 Fig. 8-1. Recalculate loop compensation and peak-current limits for all PDOs before fabrication."
          schX={11}
          schY={-20}
          fontSize={0.6}
        />
      </schematicsheet>
      <schematicsheet
        name={`motor${channel}_pd`}
        displayName={`M${channel} / PD, protection and connector`}
      >
        <Title
          text={`M${channel} — USB-PD SOURCE / PROTECTION / MONITOR`}
          x={10}
          y={18}
        />
        <IC
          name={pd}
          mpn="STUSB4710AQ1TR"
          pinNames={pdPins}
          connections={{
            1: n("REG"),
            2: n("CC1"),
            3: n("CC2"),
            4: n("SCL"),
            5: n("SDA"),
            6: "GND",
            7: n("SEL12"),
            8: n("SEL9"),
            9: "GND",
            10: n("SEL15"),
            11: n("SEL20"),
            12: n("VBUS"),
            13: n("DISCH"),
            14: n("PD_EN_N"),
            15: n("PD1V2"),
            16: n("PD2V7"),
          }}
          {...pos(-5, -20, -8, 5)}
          width={6}
        />

        <IC
          name={fuse}
          mpn="TPS259470LRPWR"
          noConnect={["3"]}
          pinNames={efusePins}
          connections={{
            1: n("PORT_EN"),
            2: n("OVLO"),
            4: n("FAULT_N"),
            5: n("REG"),
            6: n("VBUS"),
            7: n("DVDT"),
            8: "GND",
            9: n("IMON"),
            10: n("ITIMER"),
          }}
          {...pos(5, -20, 17, 7)}
          width={5}
        />
        <UsbC
          name={`J${channel + 3}`}
          label={`M${channel} POWER`}
          vbus={n("VBUS")}
          cc1={n("CC1")}
          cc2={n("CC2")}
          {...pos(0, -25, 33, 5)}
        />
        <ESD
          name={ref("D", 3)}
          cc1={n("CC1")}
          cc2={n("CC2")}
          {...pos(-6, -25, 1, 13)}
        />
        <C
          name={ref("C", 15)}
          value="1uF"
          a={n("PD1V2")}
          {...pos(-10, -20, -20, 13)}
        />
        <C
          name={ref("C", 16)}
          value="1uF"
          a={n("PD2V7")}
          {...pos(-10, -23, -20, 10)}
        />
        <R
          name={ref("R", 10)}
          value="100k"
          a={n("REG")}
          b={n("FB")}
          {...pos(-10, -16, -20, 3)}
        />
        <R
          name={ref("R", 11)}
          value="4.12k"
          a={n("FB")}
          b={n("SEL20")}
          {...pos(-10, -18, -20, 0)}
        />
        <R
          name={ref("R", 12)}
          value="1.5k"
          a={n("SEL20")}
          b={n("SEL15")}
          {...pos(-7, -16, -20, -3)}
        />
        <R
          name={ref("R", 13)}
          value="1.50k"
          a={n("SEL15")}
          b={n("SEL12")}
          {...pos(-4, -16, -20, -6)}
        />
        <R
          name={ref("R", 14)}
          value="2.61k"
          a={n("SEL12")}
          b={n("SEL9")}
          {...pos(-1, -17, -20, -9)}
        />
        <R
          name={ref("R", 15)}
          value="9.31k"
          a={n("SEL9")}
          b="GND"
          {...pos(2, -17, -20, -12)}
        />
        <R
          name={ref("R", 16)}
          value="1k"
          a={n("IMON")}
          b="GND"
          {...pos(9, -20, 11, -2)}
        />
        <C
          name={ref("C", 17)}
          value="1nF"
          a={n("DVDT")}
          {...pos(9, -22, 20, -2)}
        />
        <C
          name={ref("C", 18)}
          value="1nF"
          a={n("ITIMER")}
          {...pos(9, -24, 29, -2)}
        />
        <R
          name={ref("R", 17)}
          value="169k"
          a={n("REG")}
          b={n("OVLO")}
          {...pos(5, -24, 11, -5)}
        />
        <R
          name={ref("R", 18)}
          value="10k"
          a={n("OVLO")}
          b="GND"
          {...pos(5, -26, 20, -5)}
        />
        <R
          name={ref("R", 19)}
          value="10k"
          a="SYS3V3"
          b={n("PD_EN_N")}
          {...pos(-10, -25, -3, -7)}
        />
        <IC
          name={ref("U", 4)}
          mpn="SN74LVC1G04DBVR"
          pinNames={{ 1: "NC", 2: "A", 3: "GND", 4: "Y", 5: "VCC" }}
          connections={{
            2: n("PD_EN_N"),
            3: "GND",
            4: n("PD_ATTACHED"),
            5: "SYS3V3",
          }}
          noConnect={["1"]}
          {...pos(-10, -28, -2, -2)}
          width={3}
        />
        <IC
          name={ref("U", 5)}
          mpn="SN74LVC1G08DBVR"
          pinNames={{ 1: "A", 2: "B", 3: "GND", 4: "Y", 5: "VCC" }}
          connections={{
            1: n("PD_ATTACHED"),
            2: "SAFE_ARMED",
            3: "GND",
            4: n("PORT_EN"),
            5: "SYS3V3",
          }}
          {...pos(9, -28, 7, -10)}
          width={3}
        />
        <R
          name={ref("R", 20)}
          value="100k"
          a={n("PORT_EN")}
          b="GND"
          {...pos(5, -28, 17, -10)}
        />
        <R
          name={ref("R", 21)}
          value="330"
          a={n("VBUS")}
          b={n("DISCH")}
          {...pos(-7, -28, 29, -6)}
          footprint="1206"
        />
        <C
          name={ref("C", 19)}
          value="10uF"
          a={n("VBUS")}
          footprint="1206"
          {...pos(-7, -31, 29, -10)}
        />
        <R
          name={ref("R", 22)}
          value="100k"
          a={n("VBUS")}
          b={n("VMON")}
          {...pos(5, -30, 11, -15)}
        />
        <R
          name={ref("R", 23)}
          value="15k"
          a={n("VMON")}
          b="GND"
          {...pos(8, -31, 20, -15)}
        />
        <C
          name={ref("C", 20)}
          value="100nF"
          a="SYS3V3"
          {...pos(-10, -31, -3, -13)}
        />
        <C
          name={ref("C", 21)}
          value="100nF"
          a="SYS3V3"
          {...pos(10, -31, -3, -16)}
        />
        <R
          name={ref("R", 24)}
          value="10k"
          a="SYS3V3"
          b={n("FAULT_N")}
          {...pos(10, -17, 29, -15)}
        />
        <Note
          text="Hardware AND: PD attachment + latched safety enable. ILM is analog current sense. Do not advertise 40 W on all four ports with a 100 W adapter."
          schX={7}
          schY={-21}
          fontSize={0.6}
        />
      </schematicsheet>
    </>
  )
}
