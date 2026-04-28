import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="G1" showAsSchematicBox>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="1uF" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const schematic_group = circuit.db.schematic_group
    .list()
    .filter((g) => g.name === "G1")
  expect(schematic_group).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0.4,
        "is_subcircuit": undefined,
        "name": "G1",
        "schematic_component_ids": [
          "schematic_component_0",
        ],
        "schematic_group_id": "schematic_group_0",
        "show_as_schematic_box": true,
        "source_group_id": "source_group_0",
        "subcircuit_id": null,
        "type": "schematic_group",
        "width": 0.4,
      },
    ]
  `)

  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_group_id: schematic_group[0].source_group_id,
  })
  expect(schematicComponent).toMatchObject({
    is_schematic_group: true,
    is_box_with_pins: true,
    source_group_id: schematic_group[0].source_group_id,
    schematic_group_id: schematic_group[0].schematic_group_id,
    size: { width: 0.4, height: 0.4 },
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
