import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box connected to external component", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="G1" showAsSchematicBox>
        <port name="OUT" direction="left" />
        <resistor name="R_INTERNAL" resistance="1k" footprint="0402" />
      </group>
      <resistor
        name="R_OUT"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "G1.OUT" }}
      />
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const groupSchematicComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  expect(groupSchematicComponent).toBeDefined()

  const schematicPort = circuit.db.schematic_port.getWhere({
    schematic_component_id: groupSchematicComponent!.schematic_component_id,
  })
  expect(schematicPort?.is_connected).toBe(true)

  expect(circuit.db.schematic_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
