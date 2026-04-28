import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box creates ports from connections prop without duplicating explicit ports", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group
        name="G1"
        showAsSchematicBox
        connections={{ OUT: "R_INTERNAL.pin1" }}
      >
        <port name="OUT" direction="left" />
        <resistor name="R_INTERNAL" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const groupSourcePorts = circuit.db.source_port
    .list()
    .filter((port) => port.name === "OUT")
  expect(groupSourcePorts).toHaveLength(1)

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const groupSchematicComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  expect(groupSchematicComponent).toBeDefined()

  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: groupSchematicComponent!.schematic_component_id,
  })
  expect(schematicPorts).toHaveLength(1)
  expect(schematicPorts[0].display_pin_label).toBe("OUT")
})
