import { modelFor } from "./jlc-adapters"
import React from "react"
import { IC, R, C, Title, Note, Wire, pcbPlacement } from "./parts"
export function UsbDataSystem() {
  const hp = {
    1: "DN1_DM",
    2: "DN1_DP",
    3: "DN2_DM",
    4: "DN2_DP",
    5: "VDD33_5",
    6: "DN3_DM",
    7: "DN3_DP",
    8: "DN4_DM",
    9: "DN4_DP",
    10: "VDD33_10",
    11: "DN5_DM",
    12: "DN5_DP",
    13: "CFG_SEL2",
    14: "LED_B7",
    15: "LED_A7",
    16: "LED_B6",
    17: "LED_A6",
    18: "LED_B5",
    19: "TEST",
    20: "PRTPWR4",
    21: "OCS4_N",
    22: "OCS3_N",
    23: "PRTPWR3",
    24: "VDD33CR",
    25: "VDD18",
    26: "PRTPWR2",
    27: "OCS2_N",
    28: "OCS1_N",
    29: "PRTPWR1",
    30: "PRTPWR5",
    31: "LED_A5",
    32: "LED_B4",
    33: "LED_A4",
    34: "GANG_EN",
    35: "OCS5_N",
    36: "PRTPWR7",
    37: "OCS7_N",
    38: "OCS6_N",
    39: "PRTPWR6",
    40: "SDA",
    41: "SCL_CFG0",
    42: "HS_CFG1",
    43: "RESET_N",
    44: "VBUS_DET",
    45: "LOCAL_PWR",
    46: "VDD33_46",
    47: "LED_A3",
    48: "BOOST1",
    49: "LED_A2",
    50: "BOOST0",
    51: "LED_A1",
    52: "VDD33_52",
    53: "DN6_DM",
    54: "DN6_DP",
    55: "DN7_DM",
    56: "DN7_DP",
    57: "VDD33_57",
    58: "UP_DM",
    59: "UP_DP",
    60: "XTAL2",
    61: "XTAL1",
    62: "VDD18PLL",
    63: "RBIAS",
    64: "VDD33PLL",
    65: "GND_EP",
  }
  const hc: Record<string, string> = {
    1: "M1_USB_DM",
    2: "M1_USB_DP",
    3: "M2_USB_DM",
    4: "M2_USB_DP",
    5: "SYS3V3",
    6: "M3_USB_DM",
    7: "M3_USB_DP",
    8: "M4_USB_DM",
    9: "M4_USB_DP",
    10: "SYS3V3",
    11: "CAM_USB_DM",
    12: "CAM_USB_DP",
    13: "GND",
    19: "GND",
    20: "USB4_EN",
    21: "USB4_OC_N",
    22: "USB3_OC_N",
    23: "USB3_EN",
    24: "SYS3V3",
    25: "HUB1V8",
    26: "USB2_EN",
    27: "USB2_OC_N",
    28: "USB1_OC_N",
    29: "USB1_EN",
    30: "USB5_EN",
    34: "GND",
    35: "USB5_OC_N",
    37: "SYS3V3",
    38: "SYS3V3",
    40: "HUB_EE_SDA",
    41: "HUB_EE_SCL",
    42: "GND",
    43: "HUB_RESET_N",
    44: "MPU_HOST_EN",
    45: "GND",
    46: "SYS3V3",
    48: "GND",
    50: "GND",
    52: "SYS3V3",
    53: "HUB_DISABLE6_M",
    54: "HUB_DISABLE6_P",
    55: "HUB_DISABLE7_M",
    56: "HUB_DISABLE7_P",
    57: "SYS3V3",
    58: "HOST_USB_DM",
    59: "HOST_USB_DP",
    60: "HUB_XO",
    61: "HUB_XI",
    62: "HUB1V8_PLL",
    63: "HUB_RBIAS",
    64: "SYS3V3",
    65: "GND",
  }
  const nc = Object.keys(hp).filter((x) => !hc[x])
  const p = (x: number, y: number, sx: number, sy: number) => ({
    pcbX: x,
    pcbY: y,
    schX: sx,
    schY: sy,
  })
  return (
    <schematicsheet
      sheetWidth={330}
      sheetHeight={280}
      name="usb_hub"
      displayName="05 / USB 2.0 host hub"
    >
      <Title
        text="05 — USB2517 / FIVE DOWNSTREAM PORTS / STM32MP157 USB HOST"
        x={0}
        y={27}
      />
      <IC
        name="U20"
        mpn="USB2517I-JZX"
        pinNames={hp}
        connections={hc}
        noConnect={nc}
        {...p(53, -5, 0, 4)}
        width={8}
      />
      <chip
        {...modelFor("ABM8-24.000MHZ-B2-T")}
        name="Y20"
        pinLabels={{ pin1: "XI", pin2: "GND2", pin3: "XO", pin4: "GND4" }}
        {...p(48, 3, -17, 18)}
        {...pcbPlacement("Y20")}
        schX={-17 * 0.38}
        schY={18 * 0.45}
      />
      <Wire from="Y20.pin1" to="HUB_XI" />
      <Wire from="Y20.pin3" to="HUB_XO" />
      <Wire from="Y20.pin2" to="GND" />
      <Wire from="Y20.pin4" to="GND" />
      <C name="C2000" value="33pF" a="HUB_XI" {...p(46, 1, -25, 12)} />
      <C name="C2001" value="33pF" a="HUB_XO" {...p(49, 1, -16, 12)} />
      <R name="R2008" value="1M" a="HUB_XI" b="HUB_XO" {...p(48, 6, -22, 23)} />
      <C name="C2012" value="1uF" a="SYS3V3" {...p(58, -12, -30, -20)} />
      <C name="C2013" value="1uF" a="SYS3V3" {...p(61, -12, -30, -24)} />
      <C name="C2014" value="1uF" a="SYS3V3" {...p(64, -12, -30, -28)} />
      <R name="R2000" value="12k" a="HUB_RBIAS" b="GND" {...p(49, 4, -21, 7)} />
      <IC
        name="U21"
        mpn="24LC02BT-I/SN"
        pinNames={{
          1: "A0",
          2: "A1",
          3: "A2",
          4: "VSS",
          5: "SDA",
          6: "SCL",
          7: "WP",
          8: "VCC",
        }}
        connections={{
          1: "GND",
          2: "GND",
          3: "GND",
          4: "GND",
          5: "HUB_EE_SDA",
          6: "HUB_EE_SCL",
          7: "GND",
          8: "SYS3V3",
        }}
        {...p(63, 4, 19, 16)}
        width={4}
      />
      <R
        name="R2001"
        value="4.7k"
        a="SYS3V3"
        b="HUB_EE_SDA"
        {...p(61, 9, 13, 24)}
      />
      <R
        name="R2002"
        value="4.7k"
        a="SYS3V3"
        b="HUB_EE_SCL"
        {...p(65, 9, 25, 24)}
      />
      <R
        name="R2003"
        value="10k"
        a="SYS3V3"
        b="HUB_RESET_N"
        {...p(58, 3, 20, 7)}
      />
      <C name="C2002" value="100nF" a="HUB_RESET_N" {...p(59, 1, 20, 3)} />
      {[
        "HUB_DISABLE6_M",
        "HUB_DISABLE6_P",
        "HUB_DISABLE7_M",
        "HUB_DISABLE7_P",
      ].map((n, i) => (
        <R
          key={n}
          name={`R${2004 + i}`}
          value="10k"
          a="SYS3V3"
          b={n}
          {...p(63 + (i % 2) * 3, -9 - Math.floor(i / 2) * 2, 20, -2 - i * 3)}
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <C
          key={i}
          name={`C${2003 + i}`}
          value="100nF"
          a="SYS3V3"
          {...p(47 + (i % 4) * 3, -12 - Math.floor(i / 4) * 2, -23, 2 - i * 3)}
        />
      ))}
      <C name="C2010" value="1uF" a="HUB1V8" {...p(56, 4, 20, -16)} />
      <C name="C2011" value="1uF" a="HUB1V8_PLL" {...p(53, 4, 20, -20)} />
      <Note
        text="USB2.0 480 Mbit/s shared upstream. EEPROM selects self-powered / individual switching; ports 6 and 7 disabled. Strap and EEPROM image require bench verification."
        schX={0}
        schY={-24}
        fontSize={0.6}
      />
    </schematicsheet>
  )
}
