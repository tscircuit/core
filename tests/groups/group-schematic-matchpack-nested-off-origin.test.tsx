import { expect, test } from "bun:test"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("matchpack centers an off-origin nested group by its occupied bounds", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <group name="OFFSET_GROUP">
        <resistor name="R_INNER" resistance="1k" schX={4} schY={6} />
      </group>
      <resistor name="R_OUTER" resistance="1k" />
      <trace from=".R_INNER > .pin2" to=".R_OUTER > .pin1" />
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({
    name: "OFFSET_GROUP",
  })
  const schematicGroup = circuit.db.schematic_group.getWhere({
    source_group_id: sourceGroup!.source_group_id,
  })
  const sourceInnerResistor = circuit.db.source_component.getWhere({
    name: "R_INNER",
  })
  const schematicInnerResistor = circuit.db.schematic_component.getWhere({
    source_component_id: sourceInnerResistor!.source_component_id,
  })
  const innerBounds = getSchematicComponentWithTextBounds({
    db: circuit.db,
    schematicComponent: schematicInnerResistor!,
  })!

  expect(schematicGroup!.center.x).toBeCloseTo(
    (innerBounds.minX + innerBounds.maxX) / 2,
  )
  expect(schematicGroup!.center.y).toBeCloseTo(
    (innerBounds.minY + innerBounds.maxY) / 2,
  )
  expect(schematicGroup!.width).toBeCloseTo(innerBounds.maxX - innerBounds.minX)
  expect(schematicGroup!.height).toBeCloseTo(
    innerBounds.maxY - innerBounds.minY,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
