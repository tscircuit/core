import React from "react"
import { IC, R, C, Title, Note, pins, Wire } from "./parts"
export function SafetyController() {
  const con: Record<string, string> = {
    4: "SYS3V3",
    5: "SYS3V3",
    6: "SYS3V3",
    7: "GND",
    10: "MCU_RESET_N",
    11: "M1_IMON",
    12: "M1_VMON",
    13: "M2_IMON",
    14: "M2_VMON",
    15: "M3_IMON",
    16: "M3_VMON",
    17: "M4_IMON",
    18: "M4_VMON",
    19: "INPUT_IMON",
    20: "INPUT_VMON",
    21: "PC_DETECT",
    22: "I2C_SCL",
    23: "I2C_SDA",
    24: "M1_BUCK_EN",
    25: "M2_BUCK_EN",
    26: "M3_BUCK_EN",
    27: "M4_BUCK_EN",
    28: "WDI",
    30: "ARM_PULSE",
    31: "SAFE_ARMED",
    33: "MCU_TX",
    34: "MCU_RX",
    35: "SWDIO",
    36: "SWCLK",
    37: "HUB_RESET_N",
    38: "M1_FAULT_N",
    39: "M2_FAULT_N",
    40: "M3_FAULT_N",
    41: "M4_FAULT_N",
    42: "PD_ALERT_N",
    43: "PD_20V_OK_N",
    44: "PD_ATTACH_N",
    45: "MUX_RESET_N",
    46: "INPUT_FAULT_N",
  }
  const p = (x: number, y: number, sx: number, sy: number) => ({
    pcbX: x,
    pcbY: y,
    schX: sx,
    schY: sy,
  })
  return (
    <>
      <schematicsheet
        name="safety_mcu"
        displayName="06 / Safety MCU and power monitoring"
      >
        <Title
          text="06 — STM32G030 / POWER BUDGET / WATCHDOG / FAIL-OFF STARTUP"
          x={0}
          y={23}
        />
        <IC
          name="U30"
          mpn="STM32G030C8T6"
          pinNames={pins.STM32G030C8Tx}
          connections={con}
          noConnect={Object.keys(pins.STM32G030C8Tx).filter((p) => !con[p])}
          {...p(66, 28, 0, 4)}
          width={8}
        />
        <C name="C3100" value="100nF" a="SYS3V3" {...p(60, 30, -20, 12)} />
        <C name="C3101" value="4.7uF" a="SYS3V3" {...p(60, 27, -20, 8)} />
        <C name="C3102" value="100nF" a="SYS3V3" {...p(61, 24, -20, 4)} />
        <R
          name="R3100"
          value="10k"
          a="SYS3V3"
          b="MCU_RESET_N"
          {...p(63, 22, -20, 0)}
        />
        <C name="C3103" value="100nF" a="MCU_RESET_N" {...p(67, 22, -20, -4)} />
        {["PD_ALERT_N", "PD_20V_OK_N", "PD_ATTACH_N", "MUX_RESET_N"].map(
          (n, i) => (
            <R
              key={n}
              name={`R${3101 + i}`}
              value="10k"
              a="SYS3V3"
              b={n}
              {...p(72, 24 + i * 2, 20, 12 - i * 4)}
            />
          ),
        )}
        <Note
          text="Firmware must reserve system power, validate the input PD contract, program safe source PDOs, confirm all faults clear, then pulse ARM. Linux cannot bypass the hardware latch."
          schX={0}
          schY={-19}
          fontSize={0.6}
        />
      </schematicsheet>
      <schematicsheet
        name="safety_latch"
        displayName="07 / Independent watchdog and E-stop latch"
      >
        <Title
          text="07 — HARDWARE MOTOR-OFF LATCH / MANUAL RE-ARM AFTER FAULT"
          x={0}
          y={17}
        />
        <IC
          name="U31"
          mpn="TPS3431SDRBR"
          pinNames={{
            1: "VDD",
            2: "CWD",
            3: "EN",
            4: "GND",
            5: "SET1",
            6: "WDI",
            7: "WDO_N",
            8: "ENOUT",
            9: "EP",
          }}
          connections={{
            1: "SYS3V3",
            2: "WDT_TIME",
            3: "SYS3V3",
            4: "GND",
            5: "SYS3V3",
            6: "WDI",
            7: "WD_OK_N",
            9: "GND",
          }}
          noConnect={["8"]}
          {...p(76, 37, -18, 7)}
          width={4}
        />
        <C name="C3110" value="47nF" a="WDT_TIME" {...p(79, 37, -28, 7)} />
        <C name="C3111" value="100nF" a="SYS3V3" {...p(76, 40, -28, 2)} />
        <R
          name="R3110"
          value="10k"
          a="SYS3V3"
          b="WD_OK_N"
          {...p(79, 40, -18, -2)}
        />
        <IC
          name="U32"
          mpn="SN74LVC1G08DBVR"
          pinNames={{ 1: "A", 2: "B", 3: "GND", 4: "Y", 5: "VCC" }}
          connections={{
            1: "WD_OK_N",
            2: "ESTOP_OK",
            3: "GND",
            4: "FAULT_CLEAR_N",
            5: "SYS3V3",
          }}
          {...p(76, 32, -5, 6)}
          width={3}
        />
        <IC
          name="U33"
          mpn="SN74LVC74APWR"
          pinNames={{
            1: "CLR1_N",
            2: "D1",
            3: "CLK1",
            4: "PRE1_N",
            5: "Q1",
            6: "Q1_N",
            7: "GND",
            8: "Q2_N",
            9: "Q2",
            10: "PRE2_N",
            11: "CLK2",
            12: "D2",
            13: "CLR2_N",
            14: "VCC",
          }}
          connections={{
            1: "SAFETY_CLEAR_N",
            2: "SYS3V3",
            3: "ARM_PULSE",
            4: "SYS3V3",
            5: "SAFE_ARMED",
            7: "GND",
            10: "SYS3V3",
            11: "GND",
            12: "GND",
            13: "GND",
            14: "SYS3V3",
          }}
          noConnect={["6", "8", "9"]}
          {...p(77, 24, 10, 5)}
          width={5}
        />
        <IC
          name="U35"
          mpn="SN74LVC1G08DBVR"
          pinNames={{ 1: "A", 2: "B", 3: "GND", 4: "Y", 5: "VCC" }}
          connections={{
            1: "FAULT_CLEAR_N",
            2: "MCU_RESET_N",
            3: "GND",
            4: "SAFETY_CLEAR_N",
            5: "SYS3V3",
          }}
          {...p(80, 16, -5, -8)}
        />
        <IC
          name="U36"
          mpn="TLV803EA29DBZR"
          pinNames={{ 1: "GND", 2: "RESET_N", 3: "VDD" }}
          connections={{ 1: "GND", 2: "MCU_RESET_N", 3: "SYS3V3" }}
          {...p(70, 18, -18, -8)}
        />
        <C name="C3114" value="100nF" a="SYS3V3" {...p(70, 15, -28, -8)} />
        <C name="C3115" value="100nF" a="SYS3V3" {...p(80, 12, 5, -8)} />
        <R
          name="R3111"
          value="100k"
          a="ARM_PULSE"
          b="GND"
          {...p(79, 20, 22, 8)}
        />
        <R
          name="R3112"
          value="10k"
          a="ESTOP_OK"
          b="GND"
          {...p(78, 29, -5, -2)}
        />
        <C name="C3112" value="100nF" a="SYS3V3" {...p(74, 20, 10, -5)} />
        <C name="C3113" value="100nF" a="SYS3V3" {...p(73, 32, -5, -6)} />
        <Note
          text="E-stop loop open = low = asynchronous clear. Watchdog timeout clears latch. Fresh MCU ARM edge is required; watchdog recovery cannot restart motors by itself."
          schX={0}
          schY={-18}
          fontSize={0.6}
        />
      </schematicsheet>
      <schematicsheet
        name="pd_bus_mux"
        displayName="08 / Four independent PD configuration buses"
      >
        <Title
          text="08 — I2C MULTIPLEXER / FOUR IDENTICAL PD SOURCE ADDRESSES"
          x={0}
          y={17}
        />
        <IC
          name="U34"
          mpn="PCA9546APW,118"
          pinNames={{
            1: "A0",
            2: "A1",
            3: "RESET_N",
            4: "SD0",
            5: "SC0",
            6: "SD1",
            7: "SC1",
            8: "GND",
            9: "SD2",
            10: "SC2",
            11: "SD3",
            12: "SC3",
            13: "A2",
            14: "SCL",
            15: "SDA",
            16: "VDD",
          }}
          connections={{
            1: "GND",
            2: "GND",
            3: "MUX_RESET_N",
            4: "M1_SDA",
            5: "M1_SCL",
            6: "M2_SDA",
            7: "M2_SCL",
            8: "GND",
            9: "M3_SDA",
            10: "M3_SCL",
            11: "M4_SDA",
            12: "M4_SCL",
            13: "GND",
            14: "I2C_SCL",
            15: "I2C_SDA",
            16: "SYS3V3",
          }}
          {...p(47, 25, 0, 4)}
          width={6}
        />
        {[1, 2, 3, 4].flatMap((ch) =>
          ["SDA", "SCL"].map((s, i) => (
            <R
              key={`${ch}${s}`}
              name={`R${3120 + (ch - 1) * 2 + i}`}
              value="4.7k"
              a="SYS3V3"
              b={`M${ch}_${s}`}
              {...p(43 + (ch - 1) * 3, 20 - i * 2, 16 + i * 10, 12 - ch * 5)}
            />
          )),
        )}
        <C name="C3120" value="100nF" a="SYS3V3" {...p(45, 29, -12, 5)} />
      </schematicsheet>
    </>
  )
}
