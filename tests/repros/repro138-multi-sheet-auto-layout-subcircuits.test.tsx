import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A generic LED driver block: driver IC + decoupling cap + current-limiting
 * resistor + indicator LED. Intentionally carries NO schX/schY, so the
 * schematic is placed by the layout engine (auto layout).
 */
const LedDriver = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic4"
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "IN", pin4: "OUT" }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VCC", "IN", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["OUT"] },
      }}
      connections={{ VCC: "net.VCC", GND: "net.GND" }}
    />
    <capacitor
      name="C_DEC"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "U1.VCC", pin2: "net.GND" }}
    />
    <resistor
      name="R_LED"
      resistance="330"
      footprint="0402"
      connections={{ pin1: "U1.OUT", pin2: "D1.anode" }}
    />
    <led name="D1" footprint="0603" connections={{ cathode: "net.GND" }} />
  </subcircuit>
)

/**
 * A generic buffered RC filter block: buffer IC + input RC low-pass + output
 * decoupling cap. Intentionally carries NO schX/schY, so the schematic is
 * placed by the layout engine (auto layout).
 */
const RcFilter = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic4"
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "IN", pin4: "OUT" }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["IN", "VCC", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["OUT"] },
      }}
      connections={{ VCC: "net.VCC", GND: "net.GND" }}
    />
    <resistor
      name="R_F"
      resistance="1k"
      footprint="0402"
      connections={{ pin1: "net.SIG_IN", pin2: "U1.IN" }}
    />
    <capacitor
      name="C_F"
      capacitance="10nF"
      footprint="0402"
      connections={{ pin1: "U1.IN", pin2: "net.GND" }}
    />
    <capacitor
      name="C_OUT"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "U1.OUT", pin2: "net.GND" }}
    />
  </subcircuit>
)

/**
 * REPRO: two different significant subcircuits on two separate schematic sheets,
 * laid out automatically. Neither subcircuit defines schX/schY for its internal
 * components, so each sheet's subcircuit is placed entirely by the schematic
 * layout engine. Each sheet should be laid out independently.
 */
test("auto-laid-out subcircuits on separate sheets render independently", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet 1" displayName="Sheet 1" sheetIndex={0} />
      <schematicsheet name="Sheet 2" displayName="Sheet 2" sheetIndex={1} />

      <LedDriver name="DRV" schSheetName="Sheet 1" />
      <RcFilter name="FLT" schSheetName="Sheet 2" />
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
