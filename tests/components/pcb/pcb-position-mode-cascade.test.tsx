import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Cascade behaviour for `pcbPositionMode="relative_to_board_anchor"`:
// when a chip declares board-absolute positioning, none of its parent
// groups should be moved by the auto-placer. Otherwise the chip's
// "absolute" coordinates end up shifted by the group offset assigned
// during the group's pack.
//
// Reproduces the daughter-board scenario from issue #2242 where
// setting pcbX/pcbY + pcbPositionMode on the chip produced a
// position_mode label that matched, but the actual position was
// shifted because the parent group lacked pcbX/pcbY of its own.

test("pcbPositionMode='relative_to_board_anchor' cascades through ungrouped parents — chip lands at requested coords", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <group name="region_a">
        {/* Chip declares board-absolute placement. The group has no
            pcbX/pcbY, but the cascade should still keep the chip at
            its requested coords. */}
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={10}
          pcbY={5}
          pcbPositionMode="relative_to_board_anchor"
        />
        {/* A sibling without explicit positioning — packer should
            place this somewhere in the group, but R1 stays put. */}
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1Source = circuit.db.source_component
    .list()
    .find((c) => c.name === "R1")
  expect(r1Source).toBeDefined()
  const r1 = circuit.db.pcb_component
    .list()
    .find((c) => c.source_component_id === r1Source!.source_component_id)
  expect(r1).toBeDefined()
  expect(r1?.center.x).toBeCloseTo(10, 1)
  expect(r1?.center.y).toBeCloseTo(5, 1)
})

test("siblings without pcbPositionMode still get auto-placed (cascade is opt-in)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <group name="region">
        {/* Two siblings, neither with pcbPositionMode. Existing
            auto-placer behaviour must be preserved when no descendant
            opts into board-anchor positioning. */}
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  // Just verify the build didn't throw and components were placed.
  const pcbComps = circuit.db.pcb_component.list()
  expect(pcbComps.length).toBe(2)
  // No assertions about exact positions — packer is free to choose.
})
