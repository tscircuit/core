import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** A generic I2C sensor block: sensor IC + decoupling + SDA/SCL pull-ups. */
const I2cSensor = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic6"
      pinLabels={{
        pin1: "VDD",
        pin2: "GND",
        pin3: "SDA",
        pin4: "SCL",
        pin5: "INT",
        pin6: "ADDR",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["SDA", "SCL", "INT", "ADDR"],
        },
      }}
      connections={{ VDD: "net.VDD", GND: "net.GND" }}
      schX={0}
      schY={0}
    />
    <capacitor
      name="C_VDD"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "U1.VDD", pin2: "net.GND" }}
      schX={-3}
      schY={-0.5}
      schRotation={270}
    />
    <resistor
      name="R_SDA"
      resistance="4.7k"
      footprint="0402"
      connections={{ pin1: "U1.SDA", pin2: "U1.VDD" }}
      schX={3}
      schY={1.5}
      schRotation={270}
    />
    <resistor
      name="R_SCL"
      resistance="4.7k"
      footprint="0402"
      connections={{ pin1: "U1.SCL", pin2: "U1.VDD" }}
      schX={4.5}
      schY={1.5}
      schRotation={270}
    />
  </subcircuit>
)

/** A generic microcontroller block: MCU + VDD decoupling cap + reset pull-up. */
const McuModule = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "VDD",
        pin2: "GND",
        pin3: "RESET",
        pin4: "SWDIO",
        pin5: "SWCLK",
        pin6: "IO1",
        pin7: "IO2",
        pin8: "IO3",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VDD", "RESET", "GND"] },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["SWDIO", "SWCLK", "IO1", "IO2", "IO3"],
        },
      }}
      connections={{ VDD: "net.VDD", GND: "net.GND" }}
      schX={0}
      schY={0}
    />
    <capacitor
      name="C_VDD"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "U1.VDD", pin2: "net.GND" }}
      schX={-3}
      schY={-0.5}
      schRotation={270}
    />
    <resistor
      name="R_RST"
      resistance="10k"
      footprint="0402"
      connections={{ pin1: "U1.RESET", pin2: "U1.VDD" }}
      schX={-3}
      schY={1.5}
      schRotation={270}
    />
  </subcircuit>
)

/**
 * REPRO: two different significant subcircuits on two separate schematic sheets
 * (an I2C sensor on Sheet 1, a microcontroller on Sheet 2). Each sheet should
 * render its own subcircuit independently, without the other sheet affecting it.
 */
test("sensor and mcu on separate sheets render independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet 1" displayName="Sheet 1" sheetIndex={0} />
      <schematicsheet name="Sheet 2" displayName="Sheet 2" sheetIndex={1} />

      <I2cSensor name="SEN" schSheetName="Sheet 1" />
      <McuModule name="MCU" schSheetName="Sheet 2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sheet1 = circuit.db.schematic_sheet.getWhere({ name: "Sheet 1" })!
  const sheet2 = circuit.db.schematic_sheet.getWhere({ name: "Sheet 2" })!
  const onSheet = (id: string) =>
    circuit.db.schematic_component
      .list()
      .filter((c) => (c as any).schematic_sheet_id === id)

  expect(onSheet(sheet1.schematic_sheet_id).length).toBeGreaterThan(0)
  expect(onSheet(sheet2.schematic_sheet_id).length).toBeGreaterThan(0)

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
