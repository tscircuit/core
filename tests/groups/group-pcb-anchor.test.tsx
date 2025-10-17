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

      {/* Title */}
      <silkscreentext
        pcbX={25}
        pcbY={48}
        text="TOP_LEFT Anchor at (10,15)"
        fontSize={2}
        anchorAlignment="center"
      />

      {/* Anchor marker - crosshair lines */}
      <silkscreenpath
        route={[
          { x: 9, y: 15 },
          { x: 11, y: 15 },
        ]}
        strokeWidth={0.15}
      />
      <silkscreenpath
        route={[
          { x: 10, y: 14 },
          { x: 10, y: 16 },
        ]}
        strokeWidth={0.15}
      />
      {/* Anchor symbol and label */}
      <silkscreentext
        pcbX={10}
        pcbY={15}
        text="⊗"
        fontSize={3}
        anchorAlignment="center"
      />
      <silkscreentext
        pcbX={10}
        pcbY={12}
        text="ANCHOR"
        fontSize={1.5}
        anchorAlignment="bottom_center"
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
