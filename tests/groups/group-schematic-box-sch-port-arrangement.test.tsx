import { expect, test } from "bun:test"
import { schematic_component } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box ports respect schPinArrangement", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group
        name="G1"
        showAsSchematicBox
        schPinArrangement={{
          rightSide: {
            pins: ["VIN", "VOUT"],
            direction: "top-to-bottom",
          },
          bottomSide: {
            pins: ["GND"],
            direction: "left-to-right",
          },
        }}
      >
        <port name="VIN" direction="left" />
        <port name="GND" direction="left" />
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
  schematic_component.parse(schematicGroupComponent)
  expect(schematicGroupComponent!.port_arrangement).toMatchObject({
    right_side: { pins: [1, 3], direction: "top-to-bottom" },
    bottom_side: { pins: [2], direction: "left-to-right" },
  })

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
