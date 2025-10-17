import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested group with anchor positioning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="60mm">
      {/* Board corner markers */}
      <silkscreentext
        pcbX={0}
        pcbY={0}
        text="(0,0)"
        fontSize={2}
        anchorAlignment="bottom_left"
      />
      <silkscreentext
        pcbX={60}
        pcbY={0}
        text="(60,0)"
        fontSize={2}
        anchorAlignment="bottom_right"
      />
      <silkscreentext
        pcbX={0}
        pcbY={60}
        text="(0,60)"
        fontSize={2}
        anchorAlignment="top_left"
      />
      <silkscreentext
        pcbX={60}
        pcbY={60}
        text="(60,60)"
        fontSize={2}
        anchorAlignment="top_right"
      />

      {/* Title */}
      <silkscreentext
        pcbX={30}
        pcbY={58}
        text="NESTED Groups: Inner TOP_LEFT Anchor at (20,20)"
        fontSize={2}
        anchorAlignment="center"
      />

      {/* Outer group anchor marker */}
      <silkscreentext
        pcbX={10}
        pcbY={10}
        text="⊗ OUTER(10,10)"
        fontSize={2.5}
        anchorAlignment="center"
      />

      {/* Outer group positioned at (10, 10) */}
      <group name="OuterGroup" pcbX={10} pcbY={10} subcircuit>
        {/* Inner group anchor marker - crosshair at absolute position (20, 20) */}
        <silkscreenpath
          route={[
            { x: 9, y: 10 },
            { x: 11, y: 10 },
          ]}
          strokeWidth={0.15}
        />
        <silkscreenpath
          route={[
            { x: 10, y: 9 },
            { x: 10, y: 11 },
          ]}
          strokeWidth={0.15}
        />
        <silkscreentext
          pcbX={10}
          pcbY={10}
          text="⊗"
          fontSize={3}
          anchorAlignment="center"
        />
        <silkscreentext
          pcbX={10}
          pcbY={7}
          text="INNER ANCHOR"
          fontSize={1.5}
          anchorAlignment="bottom_center"
        />

        {/* Inner group with top_left anchor at relative (10, 10) = absolute (20, 20) */}
        <group
          name="InnerGroup"
          pcbX={10}
          pcbY={10}
          pcbPositionAnchor="top_left"
          subcircuit
        >
          <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const groups = circuit.db.pcb_group.list()
  const outerGroup = groups.find((g) => g.name === "OuterGroup")
  const innerGroup = groups.find((g) => g.name === "InnerGroup")

  // The inner group should be positioned relative to the outer group
  // Outer at (10, 10) + Inner relative (10, 10) = absolute (20, 20)
  expect(innerGroup?.anchor_alignment).toBe("top_left")

  // Since the inner group uses top_left anchor, its top-left corner should be at the target position
  // The target position is (10, 10) relative to outer, which is at (10, 10), so absolute (20, 20)
  // Note: The anchor_position stored in circuit-json represents the absolute position

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
