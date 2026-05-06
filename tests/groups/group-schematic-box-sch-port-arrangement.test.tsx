import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box ports respect schPinArrangement", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group
        name="G1"
        showAsSchematicBox
        schPinArrangement={{
          leftSide: {
            pins: ["VIN", "GND"],
            direction: "bottom-to-top",
          },
          rightSide: {
            pins: ["VOUT"],
            direction: "top-to-bottom",
          },
        }}
      >
        <port name="VIN" direction="right" />
        <port name="GND" direction="right" />
        <port name="VOUT" direction="left" />
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

  expect(portsByLabel.VIN.side_of_component).toBe("left")
  expect(portsByLabel.VIN.facing_direction).toBe("left")
  expect(portsByLabel.GND.side_of_component).toBe("left")
  expect(portsByLabel.GND.facing_direction).toBe("left")
  expect(portsByLabel.VOUT.side_of_component).toBe("right")
  expect(portsByLabel.VOUT.facing_direction).toBe("right")

  expect(portsByLabel.GND.center.y).toBeGreaterThan(portsByLabel.VIN.center.y)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
