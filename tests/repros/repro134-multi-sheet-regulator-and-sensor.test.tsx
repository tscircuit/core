import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** A generic 3.3V regulator block: regulator IC + decoupling + feedback divider. */
const PowerRegulator = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic5"
      pinLabels={{
        pin1: "VIN",
        pin2: "GND",
        pin3: "EN",
        pin4: "FB",
        pin5: "VOUT",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VIN", "EN", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["VOUT", "FB"] },
      }}
      connections={{ VIN: "net.VIN", GND: "net.GND", VOUT: "net.VOUT" }}
      schX={0}
      schY={0}
    />
    <capacitor
      name="C_IN"
      capacitance="10uF"
      footprint="0402"
      connections={{ pin1: "U1.VIN", pin2: "net.GND" }}
      schX={-3}
      schY={-0.5}
      schRotation={270}
    />
    <capacitor
      name="C_OUT"
      capacitance="22uF"
      footprint="0402"
      connections={{ pin1: "U1.VOUT", pin2: "net.GND" }}
      schX={3}
      schY={-0.5}
      schRotation={270}
    />
    <resistor
      name="R_FB1"
      resistance="100k"
      footprint="0402"
      connections={{ pin1: "U1.VOUT", pin2: "U1.FB" }}
      schX={4.5}
      schY={1}
      schRotation={270}
    />
    <resistor
      name="R_FB2"
      resistance="33k"
      footprint="0402"
      connections={{ pin1: "U1.FB", pin2: "net.GND" }}
      schX={4.5}
      schY={-1.5}
      schRotation={270}
    />
  </subcircuit>
)

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

/**
 * REPRO: two different significant subcircuits on two separate schematic sheets
 * (a power regulator on Sheet 1, an I2C sensor on Sheet 2). Each sheet should
 * render its own subcircuit independently, without the other sheet affecting it.
 */
test("regulator and sensor on separate sheets render independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet 1" displayName="Sheet 1" sheetIndex={0} />
      <schematicsheet name="Sheet 2" displayName="Sheet 2" sheetIndex={1} />

      <PowerRegulator name="REG" schSheetName="Sheet 1" />
      <I2cSensor name="SEN" schSheetName="Sheet 2" />
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
