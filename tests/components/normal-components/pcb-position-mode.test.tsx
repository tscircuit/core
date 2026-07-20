import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPositionMode=relative_to_board_anchor uses board-absolute coordinates inside a group", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="dip8"
          pcbX={5}
          pcbY={3}
          pcbPositionMode="relative_to_board_anchor"
        />
      </group>
    </board>,
  )

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  const u1 = pcbComponents.find((c) => c.source_component_id !== undefined)

  // pcbPositionMode=relative_to_board_anchor means pcbX=5, pcbY=3 are board-absolute
  // so group anchor (pcbX=16) must NOT be added on top
  expect(u1?.center.x).toBeCloseTo(5, 1)
  expect(u1?.center.y).toBeCloseTo(3, 1)
})

test("pcbPositionMode=relative_to_group_anchor (default) adds parent group offset", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="dip8"
          pcbX={5}
          pcbY={3}
          pcbPositionMode="relative_to_group_anchor"
        />
      </group>
    </board>,
  )

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  const u1 = pcbComponents.find((c) => c.source_component_id !== undefined)

  // relative_to_group_anchor: board position = group anchor (16,0) + local offset (5,3) = (21,3)
  expect(u1?.center.x).toBeCloseTo(21, 1)
  expect(u1?.center.y).toBeCloseTo(3, 1)
})
