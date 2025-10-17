import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with bottom_right anchor", async () => {
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
        text="BOTTOM_RIGHT Anchor at (30,30)"
        fontSize={2}
        anchorAlignment="center"
      />

      {/* Anchor marker - crosshair lines */}
      <silkscreenpath
        route={[
          { x: 29, y: 30 },
          { x: 31, y: 30 },
        ]}
        strokeWidth={0.15}
      />
      <silkscreenpath
        route={[
          { x: 30, y: 29 },
          { x: 30, y: 31 },
        ]}
        strokeWidth={0.15}
      />
      {/* Anchor symbol and label */}
      <silkscreentext
        pcbX={30}
        pcbY={30}
        text="⊗"
        fontSize={3}
        anchorAlignment="center"
      />
      <silkscreentext
        pcbX={30}
        pcbY={33}
        text="ANCHOR"
        fontSize={1.5}
        anchorAlignment="top_center"
      />

      <group
        name="G4"
        pcbX={30}
        pcbY={30}
        pcbPositionAnchor="bottom_right"
        subcircuit
      >
        <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.list()[0]

  expect(pcbGroup.anchor_position).toEqual({ x: 30, y: 30 })
  expect(pcbGroup.anchor_alignment).toBe("bottom_right")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
