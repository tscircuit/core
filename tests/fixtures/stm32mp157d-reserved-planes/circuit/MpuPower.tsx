import React from "react"
import { IC, R, C, Wire, Title, Note, pcbPlacement } from "./parts"
import { modelFor } from "./jlc-adapters"
export function MpuPower() {
  const labels = {
    1: "RSTn",
    2: "WAKEUP",
    3: "SDA",
    4: "SCL",
    5: "VOUT1",
    6: "PGND1",
    7: "VLX1",
    8: "BUCK1IN",
    9: "VOUT2",
    10: "PGND2",
    11: "VLX2",
    12: "BUCK2IN",
    13: "LDO3IN",
    14: "LDO3OUT",
    15: "GNDLDO",
    16: "VREFDDR",
    17: "PONKEYn",
    18: "LDO2OUT",
    19: "LDO25IN",
    20: "LDO5OUT",
    21: "LDO6OUT",
    22: "LDO16IN",
    23: "LDO1OUT",
    24: "BUCK4IN",
    25: "VLX4",
    26: "PGND4",
    27: "VOUT4",
    28: "BUCK3IN",
    29: "VLX3",
    30: "PGND3",
    31: "VOUT3",
    32: "PGBOOST",
    33: "VLXBST",
    34: "BOUT",
    35: "VBUSOTG",
    36: "VIN",
    37: "SWIN",
    38: "SWOUT",
    39: "LDO4OUT",
    40: "INTLDO",
    41: "AGND",
    42: "VIO",
    43: "INTn",
    44: "PWRCTRL",
    45: "EPGND",
  }
  const con = {
    1: "MPU_RESET_N",
    2: "PMIC_WAKEUP",
    3: "MPU_I2C4_SDA",
    4: "MPU_I2C4_SCL",
    5: "MPU_CORE",
    6: "GND",
    7: "PMIC_SW1",
    8: "MPU5V",
    9: "DDR1V35",
    10: "GND",
    11: "PMIC_SW2",
    12: "MPU5V",
    13: "DDR1V35",
    14: "DDR_VTT",
    15: "GND",
    16: "DDR_VREF",
    17: "PMIC_PONKEY_N",
    18: "PMIC_LDO2",
    19: "MPU5V",
    20: "PMIC_LDO5",
    21: "SD3V3",
    22: "MPU_AUX3V3",
    23: "MPU_VDDA",
    24: "MPU5V",
    25: "PMIC_SW4",
    26: "GND",
    27: "MPU_AUX3V3",
    28: "MPU5V",
    29: "PMIC_SW3",
    30: "GND",
    31: "MPU3V3",
    32: "GND",
    34: "MPU5V",
    36: "MPU5V",
    37: "MPU5V",
    39: "MPU_USB3V3",
    40: "PMIC_INTLDO",
    41: "GND",
    42: "MPU3V3",
    43: "PMIC_IRQ_N",
    44: "MPU_PWR_ON",
    45: "GND",
  }
  const bucks = [
    ["MPU_CORE", -24, 23],
    ["DDR1V35", -24, 16],
    ["MPU3V3", -11, 16],
    ["MPU_AUX3V3", -11, 23],
  ] as const
  return (
    <>
      <schematicsheet
        name="mpu_pmic"
        displayName="04B / STM32 power sequencing — STPMIC1A"
        sheetWidth={450}
        sheetHeight={530}
      >
        <Title
          text="STPMIC1A — 5 V INPUT / MPU + DDR + USB SEQUENCED SUPPLIES"
          y={42}
        />
        <IC
          name="U72"
          mpn="STPMIC1APQR"
          pinNames={labels}
          connections={con}
          noConnect={["33", "35", "38"]}
          pcbX={-17.5}
          pcbY={19.5}
          schX={0}
          schY={0}
        />
        {bucks.map(([rail, x, y], i) => (
          <React.Fragment key={rail}>
            <inductor
              {...modelFor("DFE252012P-1R0M=P2")}
              symbol={undefined}
              name={`L${720 + i}`}
              inductance="1uH"
              pcbX={x}
              pcbY={y}
              {...pcbPlacement(`L${720 + i}`)}
              schX={12}
              schY={12 - i * 7}
            />
            <Wire from={`L${720 + i}.pin1`} to={`PMIC_SW${i + 1}`} />
            <Wire from={`L${720 + i}.pin2`} to={rail} />
            <C
              name={`C${7200 + i}`}
              value="10uF"
              a="MPU5V"
              pcbX={x}
              pcbY={y + 3}
              schX={-34}
              schY={30 - i * 12}
            />
            <C
              name={`C${7210 + i}`}
              value="22uF"
              a={rail}
              pcbX={x}
              pcbY={y - 3}
              schX={44}
              schY={30 - i * 12}
            />
          </React.Fragment>
        ))}
        {[
          "DDR_VTT",
          "SD3V3",
          "MPU_VDDA",
          "PMIC_LDO2",
          "PMIC_LDO5",
          "MPU_USB3V3",
        ].map((n, i) => (
          <C
            key={n}
            name={`C${7220 + i}`}
            value="4.7uF"
            a={n}
            pcbX={-22 + (i % 3) * 4}
            pcbY={11 - Math.floor(i / 3) * 3}
            schX={-35 + i * 14}
            schY={-42}
          />
        ))}
        <C
          name="C7230"
          value="100nF"
          a="DDR_VREF"
          pcbX={-14}
          pcbY={29}
          schX={-36}
          schY={-30}
        />
        <C
          name="C7231"
          value="1uF"
          a="PMIC_INTLDO"
          pcbX={-11}
          pcbY={29}
          schX={-22}
          schY={-30}
        />
        <C
          name="C7232"
          value="47uF"
          a="MPU5V"
          pcbX={-27}
          pcbY={7}
          schX={-50}
          schY={-30}
        />
        <C
          name="C7233"
          value="1uF"
          a="MPU_AUX3V3"
          pcbX={-17.5}
          pcbY={25}
          schX={40}
          schY={-30}
        />
        <R
          name="R7200"
          value="4.7k"
          a="MPU3V3"
          b="MPU_I2C4_SDA"
          pcbX={-24}
          pcbY={32}
          schX={-36}
          schY={-18}
        />
        <R
          name="R7201"
          value="4.7k"
          a="MPU3V3"
          b="MPU_I2C4_SCL"
          pcbX={-20}
          pcbY={32}
          schX={-20}
          schY={-18}
        />
        <R
          name="R7202"
          value="10k"
          a="MPU3V3"
          b="PMIC_IRQ_N"
          pcbX={-16}
          pcbY={32}
          schX={20}
          schY={-18}
        />
        <R
          name="R7203"
          value="10k"
          a="PMIC_WAKEUP"
          b="GND"
          pcbX={-12}
          pcbY={32}
          schX={36}
          schY={-18}
        />
        <connector
          {...modelFor("PM254-1-02-Z-8.5")}
          name="J74"
          pcbX={-17}
          pcbY={39}
          {...pcbPlacement("J74")}
          schX={-20}
          schY={-25}
        />
        <Wire from="J74.pin1" to="PMIC_PONKEY_N" />
        <Wire from="J74.pin2" to="GND" />
        <Note
          text="AN5031 + MB1272 C03. STPMIC1A default sequence; TF-A must configure rails and reset masks. 800 MHz requires the correct VDDCORE OPP (1.35 V), not a fixed 1.2 V assumption."
          schX={0}
          schY={-52}
        />
        <Note
          text="Boost and USB power switches unused; BOUT/SWIN fed from 5 V. No PMIC power switch connects to the PC connector. VTT is available but point-to-point DDR uses series termination."
          schX={0}
          schY={-57}
        />
      </schematicsheet>
      <schematicsheet
        name="mpu_decoupling"
        displayName="04C / MPU decoupling and analog rails"
        sheetWidth={360}
        sheetHeight={280}
      >
        <Title text="LOCAL DECOUPLING — AN5031 TABLE 4 / LFBGA354" y={26} />
        {[
          ...Array.from({ length: 15 }, () => ["MPU_CORE", "1uF"]),
          ...Array.from({ length: 4 }, () => ["DDR1V35", "1uF"]),
          ...Array.from({ length: 2 }, () => ["DDR1V35", "1nF"]),
          ...Array.from({ length: 7 }, () => ["MPU3V3", "1uF"]),
          ["MPU_REG1V8", "2.2uF"],
          ["MPU_REG1V8", "1uF"],
          ["MPU_REG1V1", "2.2uF"],
          ["MPU_DSI1V2", "2.2uF"],
          ["MPU_USB3V3", "1uF"],
          ["MPU_VDDA", "100nF"],
          ["MPU_VDDA", "1uF"],
          ["MPU_VDDA", "100nF"],
          ["MPU_VDDA", "1uF"],
          ["DDR_VREF", "100nF"],
        ].map(([n, v], i) => (
          <C
            key={i}
            name={`C${7000 + i}`}
            value={v}
            a={n}
            layer="top"
            pcbX={-9.6 + (i % 7) * 3.2}
            pcbY={10 + Math.floor(i / 7) * 2.4}
            schX={-42 + (i % 7) * 14}
            schY={16 - Math.floor(i / 7) * 7}
          />
        ))}
        <Note
          text="All ground domains join GND. Regulator outputs are decoupled, not externally driven. Final capacitor locations and effective capacitance require power-integrity review."
          schX={0}
          schY={-32}
        />
      </schematicsheet>
    </>
  )
}
