import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with center anchor", async () => {
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
        text="CENTER Anchor at (20,25)"
        fontSize={2}
        anchorAlignment="center"
      />

      {/* Anchor marker - crosshair lines */}
      <silkscreenpath
        route={[
          { x: 19, y: 25 },
          { x: 21, y: 25 },
        ]}
        strokeWidth={0.15}
      />
      <silkscreenpath
        route={[
          { x: 20, y: 24 },
          { x: 20, y: 26 },
        ]}
        strokeWidth={0.15}
      />
      {/* Anchor symbol and label */}
      <silkscreentext
        pcbX={20}
        pcbY={25}
        text="⊗"
        fontSize={3}
        anchorAlignment="center"
      />
      <silkscreentext
        pcbX={20}
        pcbY={22}
        text="ANCHOR"
        fontSize={1.5}
        anchorAlignment="bottom_center"
      />

      <group
        name="G2"
        pcbX={20}
        pcbY={25}
        pcbPositionAnchor="center"
        subcircuit
      >
        <chip name="U1" footprint="dip8" pcbX={0} pcbY={0} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.list()[0]

  expect(pcbGroup.anchor_position).toEqual({ x: 20, y: 25 })
  expect(pcbGroup.anchor_alignment).toBe("center")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
