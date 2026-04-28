import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box ports", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="G1" showAsSchematicBox>
        <port name="VIN" direction="left" />
        <port name="VOUT" direction="right" />
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const schematicGroupComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  expect(schematicGroupComponent).toBeDefined()
  expect(schematicGroupComponent?.is_schematic_group).toBe(true)

  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicGroupComponent!.schematic_component_id,
  })
  expect(schematicPorts.map((port) => port.pin_number).sort()).toEqual([1, 2])
  expect(schematicPorts.map((port) => port.display_pin_label).sort()).toEqual([
    "VIN",
    "VOUT",
  ])

  const r1SourceComponent = circuit.db.source_component.getWhere({
    name: "R1",
  })
  const r1SchematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: r1SourceComponent?.source_component_id,
  })
  expect(r1SchematicComponent).toBeUndefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
