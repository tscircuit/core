import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with top_left anchor should output anchor_position and anchor_alignment", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      {/* Board corner markers */}
      <silkscreentext
        pcbX={0}
        pcbY={0}
        text="(0,0)"
        fontSize={2}
        anchorAlignment="bottom_left"
      />
      <silkscreentext
        pcbX={50}
        pcbY={0}
        text="(50,0)"
        fontSize={2}
        anchorAlignment="bottom_right"
      />
      <silkscreentext
        pcbX={0}
        pcbY={50}
        text="(0,50)"
        fontSize={2}
        anchorAlignment="top_left"
      />
      <silkscreentext
        pcbX={50}
        pcbY={50}
        text="(50,50)"
        fontSize={2}
        anchorAlignment="top_right"
      />

      {/* Anchor position marker - positioned at the exact anchor point */}
      <silkscreentext
        pcbX={10}
        pcbY={15}
        text="⊗ ANCHOR(10,15)"
        fontSize={2.5}
        anchorAlignment="top_left"
      />

      <group
        name="G1"
        pcbX={10}
        pcbY={15}
        pcbPositionAnchor="top_left"
        subcircuit
      >
        <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.list()[0]

  // The pcb_group should have anchor_position and anchor_alignment properties
  expect(pcbGroup).toHaveProperty("anchor_position")
  expect(pcbGroup).toHaveProperty("anchor_alignment")

  // Check that anchor_position matches pcbX and pcbY
  expect(pcbGroup.anchor_position).toEqual({ x: 10, y: 15 })

  // Check that anchor_alignment matches pcbPositionAnchor
  expect(pcbGroup.anchor_alignment).toBe("top_left")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
