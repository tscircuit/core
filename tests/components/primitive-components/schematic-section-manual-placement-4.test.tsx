import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createSchematicSectionFixtureSvg } from "tests/fixtures/create-schematic-section-fixture-svg"

// Variant 4: multiple components fixed per section (heavy manual placement)
test("SchematicSection manual placement: multiple components fixed per section", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="50mm" routingDisabled>
      <net name="VCC" />
      <net name="GND" />
      <net name="VCC_3V3" />
      <net name="SDA" />
      <net name="SCL" />
      <net name="TX" />
      <net name="RX" />
      <net name="LED_OUT" />
      <net name="ADC_IN" />

      <schematicsection name="power" displayName="Power Supply" />
      <schematicsection name="mcu" displayName="Microcontroller" />
      <schematicsection name="sensors" displayName="Sensors" />
      <schematicsection name="communication" displayName="Communication" />
      <schematicsection name="output" displayName="Output" />

      {/* Power: U1 + C1 both fixed */}
      <chip
        name="U1"
        footprint="soic8"
        schSectionName="power"
        schX={-10}
        schY={6}
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "EN",
          pin4: "ADJ",
          pin5: "FB",
          pin6: "NC",
          pin7: "NC",
          pin8: "VOUT",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VIN", "GND", "EN", "ADJ"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VOUT", "FB", "NC", "NC"],
          },
        }}
        connections={{
          VIN: "net.VCC",
          GND: "net.GND",
          VOUT: "net.VCC_3V3",
        }}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        schSectionName="power"
        schX={-13}
        schY={5}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        schSectionName="power"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="100k"
        footprint="0402"
        schSectionName="power"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.ADC_IN" }}
      />

      {/* MCU: U2 + C3 both fixed */}
      <chip
        name="U2"
        footprint="soic16"
        schSectionName="mcu"
        schX={0}
        schY={6}
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "PB0",
          pin4: "PB1",
          pin5: "PB2",
          pin6: "PB3",
          pin7: "SDA",
          pin8: "SCL",
          pin9: "TX",
          pin10: "RX",
          pin11: "ADC0",
          pin12: "ADC1",
          pin13: "LED",
          pin14: "RST",
          pin15: "XTAL1",
          pin16: "XTAL2",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "GND", "PB0", "PB1", "PB2", "PB3", "SDA", "SCL"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["TX", "RX", "ADC0", "ADC1", "LED", "RST", "XTAL1", "XTAL2"],
          },
        }}
        connections={{
          VCC: "net.VCC_3V3",
          GND: "net.GND",
          SDA: "net.SDA",
          SCL: "net.SCL",
          TX: "net.TX",
          RX: "net.RX",
          ADC0: "net.ADC_IN",
          LED: "net.LED_OUT",
        }}
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0402"
        schSectionName="mcu"
        schX={3}
        schY={5}
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schSectionName="mcu"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.SCL" }}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        schSectionName="mcu"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.SDA" }}
      />

      {/* Sensors: U3 + R4 both fixed */}
      <chip
        name="U3"
        footprint="soic8"
        schSectionName="sensors"
        schX={12}
        schY={6}
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "SDA",
          pin4: "SCL",
          pin5: "INT",
          pin6: "ADDR",
          pin7: "NC",
          pin8: "NC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "GND", "SDA", "SCL"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["INT", "ADDR", "NC", "NC"],
          },
        }}
        connections={{
          VCC: "net.VCC_3V3",
          GND: "net.GND",
          SDA: "net.SDA",
          SCL: "net.SCL",
        }}
      />
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="0402"
        schSectionName="sensors"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        schSectionName="sensors"
        schX={15}
        schY={5}
        connections={{ pin1: "net.ADC_IN", pin2: "net.GND" }}
      />

      {/* Communication: U4 + R5 both fixed */}
      <chip
        name="U4"
        footprint="soic8"
        schSectionName="communication"
        schX={-12}
        schY={-6}
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "TX",
          pin4: "RX",
          pin5: "CTS",
          pin6: "RTS",
          pin7: "NC",
          pin8: "NC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "GND", "TX", "RX"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["CTS", "RTS", "NC", "NC"],
          },
        }}
        connections={{
          VCC: "net.VCC_3V3",
          GND: "net.GND",
          TX: "net.RX",
          RX: "net.TX",
        }}
      />
      <capacitor
        name="C5"
        capacitance="100nF"
        footprint="0402"
        schSectionName="communication"
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <resistor
        name="R5"
        resistance="33"
        footprint="0402"
        schSectionName="communication"
        schX={-10}
        schY={-6}
        connections={{ pin1: "net.TX", pin2: "net.RX" }}
      />

      {/* Output: D1 + R6 both fixed */}
      <led
        name="D1"
        color="red"
        footprint="led0603"
        schDisplayValue="PWR"
        schSectionName="output"
        schX={12}
        schY={-6}
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <led
        name="D2"
        color="green"
        footprint="led0603"
        schDisplayValue="STATUS"
        schSectionName="output"
        connections={{ pin1: "net.LED_OUT", pin2: "net.GND" }}
      />
      <resistor
        name="R6"
        resistance="330"
        footprint="0402"
        schSectionName="output"
        schX={14}
        schY={-5}
        connections={{ pin1: "net.VCC_3V3", pin2: "net.GND" }}
      />
      <resistor
        name="R7"
        resistance="330"
        footprint="0402"
        schSectionName="output"
        connections={{ pin1: "net.LED_OUT", pin2: "net.GND" }}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schComponents = circuitJson.filter(
    (c) => c.type === "schematic_component",
  )

  expect(schComponents).toHaveLength(18)

  for (const comp of schComponents) {
    expect((comp as any).center).toBeDefined()
    expect(isFinite((comp as any).center.x)).toBe(true)
    expect(isFinite((comp as any).center.y)).toBe(true)
  }

  expect(createSchematicSectionFixtureSvg(circuit, circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
