import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box ports use direction as arrangement", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="G1" showAsSchematicBox>
        <port name="VIN" direction="right" />
        <port name="GND" direction="down" />
        <port name="VOUT" direction="right" />
      </group>
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const schematicGroupComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  expect(schematicGroupComponent).toBeDefined()

  const portsByLabel = Object.fromEntries(
    circuit.db.schematic_port
      .list({
        schematic_component_id: schematicGroupComponent!.schematic_component_id,
      })
      .map((port) => [port.display_pin_label, port]),
  )

  expect(portsByLabel.VIN.side_of_component).toBe("right")
  expect(portsByLabel.VIN.facing_direction).toBe("right")
  expect(portsByLabel.VOUT.side_of_component).toBe("right")
  expect(portsByLabel.VOUT.facing_direction).toBe("right")
  expect(portsByLabel.GND.side_of_component).toBe("bottom")
  expect(portsByLabel.GND.facing_direction).toBe("down")

  expect(portsByLabel.VIN.center.y).toBeGreaterThan(portsByLabel.VOUT.center.y)
  expect(portsByLabel.VIN.center.x).toBe(portsByLabel.VOUT.center.x)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
