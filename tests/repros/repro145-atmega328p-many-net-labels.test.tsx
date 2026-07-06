import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1", "PD3"],
  pin2: ["pin2", "PD4"],
  pin3: ["GND3", "GND"],
  pin4: ["VCC2", "VCC"],
  pin5: ["GND2", "GND"],
  pin6: ["VCC1", "VCC"],
  pin7: ["pin7", "PB6"],
  pin8: ["pin8", "PB7"],
  pin9: ["pin9", "PD5"],
  pin10: ["pin10", "PD6"],
  pin11: ["pin11", "PD7"],
  pin12: ["pin12", "PB0"],
  pin13: ["pin13", "PB1"],
  pin14: ["pin14", "PB2"],
  pin15: ["pin15", "PB3", "MOSI"],
  pin16: ["pin16", "PB4", "MISO"],
  pin17: ["pin17", "PB5", "SCK"],
  pin18: ["AVCC"],
  pin19: ["ADC6"],
  pin20: ["AREF"],
  pin21: ["GND1", "GND"],
  pin22: ["ADC7"],
  pin23: ["pin23", "PC0", "ADC0"],
  pin24: ["pin24", "PC1", "ADC1"],
  pin25: ["pin25", "PC2", "ADC2"],
  pin26: ["pin26", "PC3", "ADC3"],
  pin27: ["pin27", "PC4", "ADC4"],
  pin28: ["pin28", "PC5", "ADC5"],
  pin29: ["pin29", "PC6", "RESET"],
  pin30: ["pin30", "PD0", "RXD"],
  pin31: ["pin31", "PD1", "TXD"],
  pin32: ["pin32", "PD2", "INT0"],
} as const

const ATMEGA328P_AU = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C14877"],
      }}
      manufacturerPartNumber="ATMEGA328P_AU"
      footprint="soic32"
      {...props}
    />
  )
}

test("repro145 atmega328p many net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <ATMEGA328P_AU name="U_MCU" schX={10} schY={14} />
      <capacitor
        name="C_AREF"
        capacitance="100nF"
        footprint="0603"
        manufacturerPartNumber="CC0603KRX7R9BB104"
        supplierPartNumbers={{ jlcpcb: ["C14663"] }}
        pcbX={20}
        pcbY={2}
        schX={14}
        schY={14}
      />
      <resistor
        name="R_FAULT_PULLUP"
        resistance="10k"
        footprint="0603"
        manufacturerPartNumber="0603WAF1002T5E"
        supplierPartNumbers={{ jlcpcb: ["C25804"] }}
        pcbX={-14}
        pcbY={-14}
        schX={14}
        schY={10}
      />
      <capacitor
        name="C_MCU_DEC"
        capacitance="100nF"
        footprint="0603"
        manufacturerPartNumber="CC0603KRX7R9BB104"
        supplierPartNumbers={{ jlcpcb: ["C14663"] }}
        pcbX={20}
        pcbY={8}
        schX={14}
        schY={16}
      />

      <trace from="C_MCU_DEC.pin1" to="U_MCU.VCC1" />
      <trace from="C_MCU_DEC.pin2" to="U_MCU.GND3" />
      <trace from="C_AREF.pin1" to="U_MCU.AREF" />
      <trace from="C_AREF.pin2" to="net.GND" />
      <trace from="U_MCU.pin4" to="net.VCC_3V3" />
      <trace from="U_MCU.pin6" to="net.VCC_3V3" />
      <trace from="U_MCU.AVCC" to="net.VCC_3V3" />
      <trace from="U_MCU.pin3" to="net.GND" />
      <trace from="U_MCU.pin5" to="net.GND" />
      <trace from="U_MCU.pin21" to="net.GND" />
      <trace from="U_MCU.ADC0" to="net.JOY_X" />
      <trace from="U_MCU.ADC1" to="net.JOY_Y" />
      <trace from="U_MCU.ADC2" to="net.X_SPEED_WIPER" />
      <trace from="U_MCU.ADC3" to="net.Y_SPEED_WIPER" />
      <trace from="U_MCU.ADC4" to="net.JOY_SW" />
      <trace from="U_MCU.PD5" to="net.X_IN1" />
      <trace from="U_MCU.PD6" to="net.X_IN2" />
      <trace from="U_MCU.PD7" to="net.Y_IN1" />
      <trace from="U_MCU.PB0" to="net.Y_IN2" />
      <trace from="U_MCU.INT0" to="net.FAULT" />
      <trace from="R_FAULT_PULLUP.pin1" to="net.VCC_3V3" />
      <trace from="R_FAULT_PULLUP.pin2" to="net.FAULT" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
