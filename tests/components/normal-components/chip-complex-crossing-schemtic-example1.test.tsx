import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("complex chip schematic with multiple connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX={3}
        schY={3}
        pcbX={3}
      />
      <chip
        manufacturerPartNumber="ATmega328P"
        name="U1"
        pinLabels={{
          pin1: "RESET",
          pin2: "XTAL2",
          pin3: "XTAL1",
          pin4: "AREF",
          pin5: "AVCC",
          pin6: "AGND",
          pin7: "VCC",
          pin8: "GND",
          pin9: "PB5",
          pin10: "PB4",
          pin11: "PB3",
          pin12: "PB2",
          pin13: "PB1",
          pin14: "PB0",
          pin15: "PC5",
          pin16: "PC4",
          pin17: "PC3",
          pin18: "PC2",
          pin19: "PC1",
          pin20: "PC0",
          pin21: "PD7",
          pin22: "PD6",
          pin23: "PD5",
          pin24: "PD4",
          pin25: "PD3",
          pin26: "PD2",
          pin27: "PD1",
          pin28: "PD0",
        }}
        schX={3}
        schY={0}
        pcbX={-7}
        pcbY={-10}
        footprint="breakoutheaders_left14_right14_w8mm_p2.3mm"
      />
      <chip
        manufacturerPartNumber="ATMEGA16U2"
        name="U2"
        pinLabels={{
          pin1: "RESET",
          pin2: "XTAL2",
          pin3: "XTAL1",
          pin4: "AVCC",
          pin5: "VCC",
          pin6: "GND",
          pin7: "UCAP",
          pin8: "UVCC",
          pin9: "D-",
          pin10: "D+",
          pin11: "UGND",
          pin12: "PAD",
          pin13: "PB7",
          pin14: "PB6",
          pin15: "PB5",
          pin16: "PB4",
          pin17: "PB3",
          pin18: "PB2",
          pin19: "PB1",
          pin20: "PB0",
          pin21: "PC7",
          pin22: "PC6",
          pin23: "PC5",
          pin24: "PC4",
          pin25: "PC2",
          pin26: "PD7",
          pin27: "PD6",
          pin28: "PD5",
          pin29: "PD4",
          pin30: "PD3",
          pin31: "PD2",
          pin32: "PD1",
          pin33: "PD0",
        }}
        schX={-2}
        schY={0}
        pcbX={4}
        pcbY={13}
        footprint="qfp32_w3_p0.3mm"
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        schY={3}
        pcbX={3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      {/* Example of tracing from chip 1 to chip 2 */}
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace from=".U1 > .pin3" to=".U2 > .pin3" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
