import { expect, test } from "bun:test"
import { schematic_component } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicbox chipRef displays the chip manufacturer part number", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        manufacturerPartNumber="STM32F030F4P6"
        footprint="soic8"
        noSchematicRepresentation
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
      <schematicbox
        name="U1A"
        chipRef=".U1"
        width={2}
        height={1}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        schPinArrangement={{ leftSide: ["GND"], rightSide: ["VCC"] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const schematicBox = circuit.db.schematic_component.list()[0]
  schematic_component.parse(schematicBox)
  expect(schematicBox.port_arrangement).toMatchObject({
    left_side: { pins: [2] },
    right_side: { pins: [1] },
  })

  expect(
    circuit.db.schematic_component_styling_warning
      .list()
      .filter(
        (warning) =>
          warning.styling_issue_type === "missing_reference_designator_text",
      ),
  ).toEqual([])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
