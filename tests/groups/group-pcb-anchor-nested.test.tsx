import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested group with anchor positioning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="60mm">
      {/* Reference markers */}
      <silkscreentext pcbX={0} pcbY={0} text="(0,0)" fontSize={1.5} />
      <silkscreentext pcbX={10} pcbY={10} text="(10,10)" fontSize={1.5} />
      <silkscreentext pcbX={20} pcbY={20} text="(20,20)" fontSize={1.5} />

      {/* Outer group positioned at (10, 10) */}
      <group name="OuterGroup" pcbX={10} pcbY={10} subcircuit>
        <silkscreentext
          pcbX={0}
          pcbY={0}
          text="OUTER(10,10)"
          fontSize={1.2}
          anchorAlignment="center"
        />

        {/* Inner group with relative position (10, 10) from outer = absolute (20, 20) */}
        {/* Using top_left anchor at (10, 10) relative to outer group */}
        <group
          name="InnerGroup"
          pcbX={10}
          pcbY={10}
          pcbPositionAnchor="top_left"
          subcircuit
        >
          <silkscreentext
            pcbX={0}
            pcbY={0}
            text="INNER ANCHOR top_left"
            fontSize={1}
            anchorAlignment="center"
          />
          <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const groups = circuit.db.pcb_group.list()
  const outerGroup = groups.find((g) => g.name === "OuterGroup")
  const innerGroup = groups.find((g) => g.name === "InnerGroup")

  console.log("\n=== NESTED GROUP ANCHOR TEST ===")
  console.log(
    `Outer group center: (${outerGroup?.center.x.toFixed(2)}, ${outerGroup?.center.y.toFixed(2)})`,
  )
  console.log(
    `Inner group center: (${innerGroup?.center.x.toFixed(2)}, ${innerGroup?.center.y.toFixed(2)})`,
  )
  console.log(
    `Inner group anchor_position: (${innerGroup?.anchor_position?.x}, ${innerGroup?.anchor_position?.y})`,
  )
  console.log(`Inner group anchor_alignment: ${innerGroup?.anchor_alignment}`)

  // The inner group should be positioned relative to the outer group
  // Outer at (10, 10) + Inner relative (10, 10) = absolute (20, 20)
  expect(innerGroup?.anchor_alignment).toBe("top_left")

  // Since the inner group uses top_left anchor, its top-left corner should be at the target position
  // The target position is (10, 10) relative to outer, which is at (10, 10), so absolute (20, 20)
  // Note: The anchor_position stored in circuit-json represents the absolute position

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
