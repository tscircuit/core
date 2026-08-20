import { expect, test } from "bun:test"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { DEFAULT_SCHEMATIC_SHEET_WIDTH } from "lib/utils/schematic/insertSchematicElementOutsideSheetWarnings"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("battery power sheet content stays inside the fixed frame", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="battery_power"
        displayName="4×AA BATTERY POWER"
        sheetIndex={2}
      />

      <schematicsection name="aa_input" displayName="AA INPUT" />
      <schematicsection name="converter" displayName="5 V CONVERTER" />
      <schematicsection name="usb_priority" displayName="USB PRIORITY" />

      <connector
        name="J5"
        displayName="4xAA BATTERY JST-PH"
        pinCount={2}
        footprint="pinrow2_p2.54mm"
        schSheetName="battery_power"
        schSectionName="aa_input"
        schX={-15.75}
        schY={4}
      />
      <fuse
        name="F2"
        displayName="2A BATTERY PTC"
        currentRating="2A"
        voltageRating="16V"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="aa_input"
        schX={-12}
        schY={4}
      />
      <diode
        name="D3"
        displayName="BATTERY REVERSE PROTECTION"
        footprint="sod123"
        schSheetName="battery_power"
        schSectionName="aa_input"
        schX={-7.75}
        schY={4}
      />

      <chip
        name="U5"
        displayName="4xAA 5V BUCK-BOOST"
        footprint="soic8"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "VOUT",
          pin4: "EN",
          pin5: "VAUX",
          pin6: "L1",
          pin7: "L2",
          pin8: "FB",
        }}
        schSheetName="battery_power"
        schSectionName="converter"
        schX={0}
        schY={3}
      />
      <inductor
        name="L1"
        displayName="BUCK-BOOST 1.5UH"
        inductance="1.5uH"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={0}
        schY={6}
      />

      <capacitor
        name="C9"
        capacitance="10uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={-4.5}
        schY={0}
      />
      <capacitor
        name="C10"
        capacitance="10uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={-2}
        schY={0}
      />
      <capacitor
        name="C11"
        capacitance="10uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={0.5}
        schY={0}
      />
      <capacitor
        name="C12"
        capacitance="22uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={2.5}
        schY={0}
      />
      <capacitor
        name="C13"
        capacitance="22uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={6}
        schY={0}
      />
      <capacitor
        name="C14"
        capacitance="22uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={9.5}
        schY={0}
      />
      <capacitor
        name="C15"
        capacitance="10uF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={13}
        schY={0}
      />
      <capacitor
        name="C16"
        capacitance="100nF"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="converter"
        schX={3}
        schY={5}
      />

      <resistor
        name="R12"
        resistance="100k"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="usb_priority"
        schX={-3}
        schY={-5}
      />
      <resistor
        name="R13"
        resistance="100k"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="usb_priority"
        schX={0}
        schY={-5}
      />
      <resistor
        name="R14"
        resistance="1M"
        footprint="0402"
        schSheetName="battery_power"
        schSectionName="usb_priority"
        schX={3}
        schY={-5}
      />
      <mosfet
        name="Q1"
        displayName="USB PRIORITY DISABLE"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
        schSheetName="battery_power"
        schSectionName="usb_priority"
        schX={0.14}
        schY={-7}
      />
      <diode
        name="D4"
        displayName="BATTERY POWER OR"
        footprint="sod123"
        schSheetName="battery_power"
        schSectionName="usb_priority"
        schX={6}
        schY={-5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheet = circuit.db.schematic_sheet.getWhere({
    name: "battery_power",
  })!
  expect(schematicSheet).not.toHaveProperty("center")

  const schematicElements = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        "schematic_sheet_id" in element &&
        element.schematic_sheet_id === schematicSheet.schematic_sheet_id,
    )
  const bounds = getBoundsForSchematic(schematicElements)
  expect(bounds.minX).toBeGreaterThanOrEqual(-DEFAULT_SCHEMATIC_SHEET_WIDTH / 2)
  expect(bounds.maxX).toBeLessThanOrEqual(DEFAULT_SCHEMATIC_SHEET_WIDTH / 2)
  expect(circuit.db.schematic_element_outside_sheet_warning.list()).toEqual([])

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
