import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box participates in parent group schematic layout", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="PARENT" schWidth={6} schHeight={4}>
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
      </group>
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const groupSchematicComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  const rOutSourceComponent = circuit.db.source_component.getWhere({
    name: "R_OUT",
  })
  const rOutSchematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: rOutSourceComponent?.source_component_id,
  })

  expect(groupSchematicComponent).toBeDefined()
  expect(rOutSchematicComponent).toBeDefined()
  expect(groupSchematicComponent!.center).not.toEqual(
    rOutSchematicComponent!.center,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
