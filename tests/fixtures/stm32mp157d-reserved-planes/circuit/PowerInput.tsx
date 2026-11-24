import React from "react"
import {
  IC,
  R,
  C,
  Diode,
  SmallNMOS,
  Title,
  Note,
  UsbC,
  ESD,
  efusePins,
  pins,
} from "./parts"
export function PowerInput() {
  const p = (x: number, y: number, sx: number, sy: number) => ({
    pcbX: x,
    pcbY: y,
    schX: sx,
    schY: sy,
  })
  return (
    <schematicsheet
      name="power_input"
      displayName="01 / PD input and protection"
    >
      <Title
        text="01 — USB-C PD INPUT / 20 V, 5 A CONTRACT / PROTECTED 20 V BUS"
        x={8}
        y={17}
      />
      <UsbC
        name="J1"
        label="PD INPUT"
        vbus="PD_RAW"
        cc1="INPUT_CC1"
        cc2="INPUT_CC2"
        pcbRotation={180}
        {...p(-72, 45, -20, 3)}
      />
      <IC
        name="U1"
        mpn="STUSB4500QTR"
        pinNames={pins.STUSB4500QTR}
        connections={{
          1: "INPUT_CC1",
          2: "INPUT_CC1",
          4: "INPUT_CC2",
          5: "INPUT_CC2",
          6: "GND",
          7: "I2C_SCL",
          8: "I2C_SDA",
          9: "INPUT_DISCH",
          10: "GND",
          11: "PD_ATTACH_N",
          12: "GND",
          13: "GND",
          14: "PD_20V_OK_N",
          16: "INPUT_EN_N",
          18: "PD_SENSE",
          19: "PD_ALERT_N",
          21: "PD1V2",
          22: "GND",
          23: "PD2V7",
          24: "PD_RAW",
          25: "GND",
        }}
        noConnect={["3", "15", "17", "20"]}
        {...p(-71, 33, -4, 3)}
        width={6}
      />
      <IC
        name="U2"
        mpn="TPS259470LRPWR"
        noConnect={["3"]}
        pinNames={efusePins}
        connections={{
          1: "INPUT_UVLO",
          2: "INPUT_OVLO",
          4: "INPUT_FAULT_N",
          5: "PD_RAW",
          6: "VIN20",
          7: "INPUT_DVDT",
          8: "GND",
          9: "INPUT_IMON",
          10: "INPUT_ITIMER",
        }}
        {...p(-59, 33, 16, 5)}
        width={5}
      />
      <ESD name="D1" cc1="INPUT_CC1" cc2="INPUT_CC2" {...p(-79, 38, -20, -6)} />
      <IC
        name="D2"
        mpn="TVS2200DRVR"
        pinNames={{
          1: "GND1",
          2: "GND2",
          3: "GND3",
          4: "IN1",
          5: "IN2",
          6: "IN3",
          7: "EP",
        }}
        connections={{
          1: "GND",
          2: "GND",
          3: "GND",
          4: "PD_RAW",
          5: "PD_RAW",
          6: "PD_RAW",
          7: "GND",
        }}
        {...p(-63, 39, -20, -10)}
      />
      <R
        name="R1"
        value="470"
        a="PD_RAW"
        b="PD_SENSE"
        {...p(-76, 32, -13, 14)}
      />
      <R
        name="R2"
        value="1k"
        a="PD_RAW"
        b="INPUT_DISCH"
        {...p(-76, 30, -4, 14)}
        footprint="1206"
      />
      <C name="C1" value="1uF" a="PD1V2" {...p(-73, 28, -13, -9)} />
      <C name="C2" value="1uF" a="PD2V7" {...p(-69, 28, -4, -9)} />
      <C
        name="C3"
        value="1uF"
        a="PD_RAW"
        {...p(-69, 38, -13, -13)}
        footprint="0805"
      />
      <R
        name="R3"
        value="140k"
        a="PD_RAW"
        b="INPUT_UVLO"
        {...p(-62, 29, 10, 14)}
      />
      <R name="R4" value="10k" a="INPUT_UVLO" b="GND" {...p(-59, 29, 19, 14)} />
      <R
        name="R5"
        value="169k"
        a="PD_RAW"
        b="INPUT_OVLO"
        {...p(-57, 31, 10, -4)}
      />
      <R name="R6" value="10k" a="INPUT_OVLO" b="GND" {...p(-57, 29, 19, -4)} />
      <R name="R7" value="750" a="INPUT_IMON" b="GND" {...p(-60, 26, 10, -8)} />
      <C name="C4" value="10nF" a="INPUT_DVDT" {...p(-56, 26, 19, -8)} />
      <C name="C5" value="1nF" a="INPUT_ITIMER" {...p(-56, 24, 28, -8)} />
      <SmallNMOS
        name="Q1"
        g="INPUT_EN_N"
        d="INPUT_UVLO"
        s="GND"
        {...p(-65, 27, 30, 4)}
      />
      <R
        name="R8"
        value="100k"
        a="PD_RAW"
        b="INPUT_EN_N"
        {...p(-66, 30, 30, 12)}
      />
      <Diode
        name="D3"
        mpn="BZT52C5V1"
        a="GND"
        k="INPUT_EN_N"
        {...p(-65, 23, 30, -2)}
      />
      <R
        name="R9"
        value="100k"
        a="VIN20"
        b="INPUT_VMON"
        {...p(-58, 22, 10, -12)}
      />
      <R
        name="R10"
        value="15k"
        a="INPUT_VMON"
        b="GND"
        {...p(-55, 22, 19, -12)}
      />
      <C
        name="C6"
        value="47uF"
        a="VIN20"
        footprint="1210"
        {...p(-52, 34, 30, -12)}
      />
      <C
        name="C7"
        value="47uF"
        a="VIN20"
        footprint="1210"
        {...p(-52, 29, 30, -16)}
      />
      <R
        name="R11"
        value="10k"
        a="SYS3V3"
        b="INPUT_FAULT_N"
        {...p(-58, 19, 10, -16)}
      />
      <Note
        text="UVLO ~18 V blocks Linux/motors at USB default 5 V. eFuse provides reverse blocking, current limit, OVLO and inrush limiting. Sink NVM must request 20 V / 5 A."
        schX={5}
        schY={-21}
        fontSize={0.6}
      />
    </schematicsheet>
  )
}
