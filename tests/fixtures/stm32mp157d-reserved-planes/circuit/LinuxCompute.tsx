import React from "react"
import { IC, R, C, Title, Note, Wire, pcbPlacement } from "./parts"
import { modelFor } from "./jlc-adapters"
import {
  mpuConnections,
  mpuLabels,
  mpuNC,
  dramLabels,
  dramConnections,
  ddrAddress,
} from "./stm32mp157"
import { MpuPower } from "./MpuPower"
import { PcDataPort } from "./PcDataPort"

// Group pins by electrical function on the drawing, retaining the imported
// physical pin numbers. Adjacent supply pins avoid long, crossing supply wires.
const supplyNames = new Set([
  "GND",
  "MPU3V3",
  "MPU_CORE",
  "DDR1V35",
  "MPU_VDDA",
  "MPU_USB3V3",
  "MPU_REG1V8",
  "MPU_REG1V1",
  "MPU_DSI1V2",
  "DDR_VREF",
])
const mpuPowerPins = Object.keys(mpuLabels)
  .filter((p) => supplyNames.has(mpuConnections[p]))
  .sort(
    (a, b) =>
      mpuConnections[a].localeCompare(mpuConnections[b]) ||
      Number(a) - Number(b),
  )
const mpuSignalPins = Object.keys(mpuLabels)
  .filter((p) => !mpuPowerPins.includes(p))
  .sort((a, b) =>
    (mpuConnections[a] ?? `ZZ_${mpuLabels[a]}`).localeCompare(
      mpuConnections[b] ?? `ZZ_${mpuLabels[b]}`,
    ),
  )

function Memory() {
  return (
    <>
      <group name="DRAM_PLACEMENT" pcbX={9} pcbY={39} width={12} height={16}>
        <schematicsheet
          name="mpu_ddr"
          displayName="04D / 512 MB DDR3L — 16-bit point-to-point"
        >
          <Title
            text="512 MB DDR3L / NT5CC256M16ER-EK / 533 MHz TARGET"
            y={16}
          />
          <IC
            name="U71"
            mpn="NT5CC256M16ER-EK"
            pinNames={dramLabels}
            connections={dramConnections}
            noConnect={["9", "11", "60", "89", "91"]}
            pcbX={0}
            pcbY={0}
            pcbRotation={180}
            schX={0}
            schY={0}
          />
        </schematicsheet>
      </group>
      <schematicsheet
        name="mpu_ddr_termination"
        displayName="04D2 / DDR address and control termination"
        sheetWidth={410}
        sheetHeight={420}
      >
        <Title text="DDR ADDRESS / CONTROL SERIES TERMINATION" y={47} />
        {ddrAddress.map((n, i) => (
          <R
            key={n}
            name={`R${7100 + i}`}
            value="33"
            a={`${n}_CPU`}
            b={n}
            pcbX={-11.2 + (i % 8) * 3.2}
            pcbY={30 + Math.floor(i / 8) * 2.2}
            layer="top"
            schX={-42 + (i % 4) * 28}
            schY={43 - Math.floor(i / 4) * 7}
          />
        ))}
        <R
          name="R7130"
          value="240"
          a="MPU_DDR_ZQ"
          b="GND"
          pcbX={-2.5}
          pcbY={28.6}
          schX={-44}
          schY={-10}
        />
        <R
          name="R7131"
          value="240"
          a="DRAM_ZQ"
          b="GND"
          pcbX={5}
          pcbY={33.5}
          schX={-22}
          schY={-10}
        />
        <R
          name="R7132"
          value="100"
          a="DDR_CLKP"
          b="DDR_CLKN"
          pcbX={-1}
          pcbY={33.5}
          schX={0}
          schY={-10}
        />
        <R
          name="R7133"
          value="10k"
          a="DDR_RESETN"
          b="GND"
          pcbX={8}
          pcbY={38}
          schX={22}
          schY={-10}
        />
        <R
          name="R7134"
          value="10k"
          a="DDR_CKE"
          b="GND"
          pcbX={8}
          pcbY={41}
          schX={44}
          schY={-10}
        />
        <Note
          text="AN5122 section 3.2: 33-ohm address/control series termination; 100-ohm CLK termination; separate 240-ohm ZQ. DDR timing must match the exact memory."
          schX={0}
          schY={-20}
        />
      </schematicsheet>
      <schematicsheet
        name="dram_decoupling"
        displayName="04E / DDR local power and VREF"
        sheetWidth={310}
        sheetHeight={280}
      >
        <Title text="DDR 1.35 V / PMIC VREF / LOCAL DECOUPLING" y={18} />
        {Array.from({ length: 18 }, (_, i) => (
          <C
            key={i}
            name={`C${7100 + i}`}
            value="100nF"
            a="DDR1V35"
            pcbX={-6 + (i % 5) * 3}
            pcbY={36 + Math.floor(i / 5) * 2.3}
            layer="top"
            schX={-32 + (i % 5) * 16}
            schY={10 - Math.floor(i / 5) * 8}
          />
        ))}
        <C
          name="C7120"
          value="100nF"
          a="DDR_VREF"
          pcbX={-5}
          pcbY={44}
          schX={-24}
          schY={-26}
        />
        <C
          name="C7121"
          value="100nF"
          a="DDR_VREF"
          pcbX={5}
          pcbY={44}
          schX={0}
          schY={-26}
        />
        <C
          name="C7122"
          value="4.7uF"
          a="DDR1V35"
          pcbX={-9}
          pcbY={39}
          schX={24}
          schY={-26}
        />
      </schematicsheet>
    </>
  )
}

function Boot() {
  return (
    <schematicsheet
      name="mpu_boot"
      displayName="04F / Clock, microSD, boot and debug"
      sheetWidth={400}
      sheetHeight={470}
    >
      <Title text="24 MHz HSE / SDMMC1 3.3 V / BOOT[2:0] = 101" y={42} />
      <IC
        name="Y70"
        mpn="ABM8-24.000MHZ-B2-T"
        pinNames={{ 1: "HSE_IN", 2: "GND", 3: "HSE_OUT", 4: "GND" }}
        connections={{ 1: "MPU_HSE_IN", 2: "GND", 3: "MPU_HSE_OUT", 4: "GND" }}
        pcbX={1}
        pcbY={8}
        schX={-28}
        schY={28}
      />
      <C
        name="C7040"
        value="33pF"
        a="MPU_HSE_IN"
        pcbX={-2.5}
        pcbY={8}
        schX={-44}
        schY={21}
      />
      <C
        name="C7041"
        value="33pF"
        a="MPU_HSE_OUT"
        pcbX={4.5}
        pcbY={8}
        schX={-12}
        schY={21}
      />
      <R
        name="R7000"
        value="1k"
        a="MPU3V3"
        b="MPU_BOOT0"
        pcbX={-4}
        pcbY={10.5}
        schX={-44}
        schY={8}
      />
      <R
        name="R7001"
        value="1k"
        a="MPU3V3"
        b="MPU_BOOT2"
        pcbX={0}
        pcbY={10.5}
        schX={-24}
        schY={8}
      />
      <R
        name="R7002"
        value="3k"
        a="MPU_USB_RREF"
        b="GND"
        pcbX={10}
        pcbY={25.5}
        schX={-44}
        schY={-2}
      />
      <R
        name="R7003"
        value="10k"
        a="MPU3V3"
        b="MPU_RESET_N"
        pcbX={-7}
        pcbY={8}
        schX={-24}
        schY={-2}
      />
      <C
        name="C7042"
        value="10nF"
        a="MPU_RESET_N"
        pcbX={-10}
        pcbY={8}
        schX={-44}
        schY={-12}
      />
      <C
        name="C7043"
        value="10nF"
        a="MPU_RESET_CORE_N"
        pcbX={-10}
        pcbY={11}
        schX={-24}
        schY={-12}
      />
      <R
        name="R7004"
        value="10k"
        a="MPU3V3"
        b="MPU_CONSOLE_TX"
        pcbX={11}
        pcbY={22}
        schX={-44}
        schY={-22}
      />
      <R
        name="R7005"
        value="100k"
        a="MPU_HOST_EN"
        b="GND"
        pcbX={12}
        pcbY={16}
        schX={-24}
        schY={-22}
      />
      <IC
        name="J70"
        mpn="TF-01A"
        pinNames={{
          1: "DAT2",
          2: "DAT3",
          3: "CMD",
          4: "VDD",
          5: "CLK",
          6: "VSS",
          7: "DAT0",
          8: "DAT1",
          9: "CD",
          10: "SH1",
          11: "SH2",
          12: "SH3",
          13: "SH4",
        }}
        connections={{
          1: "SD_D2",
          2: "SD_D3",
          3: "SD_CMD",
          4: "SD3V3",
          5: "SD_CLK",
          6: "GND",
          7: "SD_D0",
          8: "SD_D1",
          10: "GND",
          11: "GND",
          12: "GND",
          13: "GND",
        }}
        noConnect={["9"]}
        pcbX={25}
        pcbY={39}
        pcbRotation={180}
        schX={29}
        schY={25}
      />
      <R
        name="R7010"
        value="22"
        a="SD_CLK_RAW"
        b="SD_CLK"
        pcbX={-10}
        pcbY={22}
        schX={8}
        schY={8}
      />
      {["SD_D0", "SD_D1", "SD_D2", "SD_D3", "SD_CMD"].map((n, i) => (
        <R
          key={n}
          name={`R${7011 + i}`}
          value="10k"
          a="SD3V3"
          b={n}
          pcbX={18 + i * 3.2}
          pcbY={30}
          schX={8 + (i % 3) * 18}
          schY={-2 - Math.floor(i / 3) * 10}
        />
      ))}
      <C
        name="C7044"
        value="4.7uF"
        a="SD3V3"
        pcbX={35}
        pcbY={31}
        schX={8}
        schY={-22}
      />
      <C
        name="C7045"
        value="100nF"
        a="SD3V3"
        pcbX={31.5}
        pcbY={31}
        schX={26}
        schY={-22}
      />
      <connector
        {...modelFor("PM254-1-06-Z-8.5")}
        name="J71"
        pcbX={26}
        pcbY={22}
        {...pcbPlacement("J71")}
        schX={-12}
        schY={-20}
      />
      {[
        "MPU3V3",
        "GND",
        "MPU_SWDIO",
        "MPU_SWCLK",
        "MPU_RESET_N",
        "MPU_CONSOLE_TX",
      ].map((n, i) => (
        <Wire key={n} from={`J71.pin${i + 1}`} to={n} />
      ))}
      <connector
        {...modelFor("PM254-1-02-Z-8.5")}
        name="J72"
        pcbX={18}
        pcbY={16}
        {...pcbPlacement("J72")}
        schX={8}
        schY={-17}
      />
      <Wire from="J72.pin1" to="MPU_BOOT0" />
      <Wire from="J72.pin2" to="GND" />
      <connector
        {...modelFor("PM254-1-02-Z-8.5")}
        name="J73"
        pcbX={24}
        pcbY={16}
        {...pcbPlacement("J73")}
        schX={17}
        schY={-17}
      />
      <Wire from="J73.pin1" to="MPU_BOOT2" />
      <Wire from="J73.pin2" to="GND" />
      <Note
        text="Short BOTH J72/J73 before reset for 000 USB/UART recovery. No UHS. Unused LSE input grounded. Reset relies on STPMIC1 cycling VDDCORE."
        schX={0}
        schY={-52}
      />
      <Note
        text="HSE capacitors are provisional for the 18 pF crystal: verify load, startup and negative resistance with actual board parasitics."
        schX={0}
        schY={-54}
      />
    </schematicsheet>
  )
}

function SafetyLink() {
  return (
    <schematicsheet
      name="mpu_safety_uart"
      displayName="04G / Linux to safety MCU"
    >
      <Title text="USART3 / Ioff BUFFERS BETWEEN POWER DOMAINS" y={22} />
      <R
        name="R3000"
        value="1k"
        a="MPU_UART_TX"
        b="UART_TO_MCU"
        pcbX={37}
        pcbY={20}
        schX={-16}
        schY={14}
      />
      <R
        name="R3001"
        value="1k"
        a="MCU_TX"
        b="UART_TO_MPU"
        pcbX={37}
        pcbY={24}
        schX={-16}
        schY={-4}
      />
      <IC
        name="U41"
        mpn="SN74LVC1G125DBVR"
        pinNames={{ 1: "OE_N", 2: "A", 3: "GND", 4: "Y", 5: "VCC" }}
        connections={{
          1: "GND",
          2: "UART_TO_MPU",
          3: "GND",
          4: "MPU_UART_RX",
          5: "MPU3V3",
        }}
        pcbX={40}
        pcbY={28}
        schX={10}
        schY={-4}
      />
      <IC
        name="U42"
        mpn="SN74LVC1G125DBVR"
        pinNames={{ 1: "OE_N", 2: "A", 3: "GND", 4: "Y", 5: "VCC" }}
        connections={{
          1: "GND",
          2: "UART_TO_MCU",
          3: "GND",
          4: "MCU_RX",
          5: "SYS3V3",
        }}
        pcbX={40}
        pcbY={19}
        schX={10}
        schY={14}
      />
      <C
        name="C3020"
        value="100nF"
        a="MPU3V3"
        pcbX={44}
        pcbY={28}
        schX={28}
        schY={-4}
      />
      <C
        name="C3021"
        value="100nF"
        a="SYS3V3"
        pcbX={44}
        pcbY={19}
        schX={28}
        schY={14}
      />
    </schematicsheet>
  )
}

export function LinuxCompute() {
  return (
    <>
      <group name="MPU_PLACEMENT" pcbX={9} pcbY={20} width={20} height={20}>
        <schematicsheet
          name="linux_compute"
          displayName="04A / STM32MP157DAB1 — Linux MPU"
          sheetWidth={400}
          sheetHeight={460}
        >
          <Title
            text="STM32MP157DAB1 / LFBGA354 / EXTERNAL 512 MB DDR3L"
            y={48}
          />
          <IC
            name="U70"
            mpn="STM32MP157DAB1"
            pinNames={mpuLabels}
            connections={mpuConnections}
            noConnect={mpuNC}
            left={mpuSignalPins}
            right={mpuPowerPins}
            pcbX={0}
            pcbY={0}
            schX={0}
            schY={0}
          />
          <Note
            text="Exact DAB-package pins from ST. USBPHYC 1 -> USB2517 host; USBPHYC 2 -> DWC2 PC device. Unused GPIO requires firmware pull/analog configuration."
            schX={0}
            schY={-48}
          />
        </schematicsheet>
      </group>
      <MpuPower />
      <Memory />
      <Boot />
      <SafetyLink />
      <PcDataPort />
    </>
  )
}
