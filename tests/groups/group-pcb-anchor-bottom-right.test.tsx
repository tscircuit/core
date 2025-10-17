import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with bottom_right anchor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      {/* Board corner markers */}
      <silkscreentext pcbX={0} pcbY={0} text="(0,0)" fontSize={2} anchorAlignment="bottom_left" />
      <silkscreentext pcbX={50} pcbY={0} text="(50,0)" fontSize={2} anchorAlignment="bottom_right" />
      <silkscreentext pcbX={0} pcbY={50} text="(0,50)" fontSize={2} anchorAlignment="top_left" />
      <silkscreentext pcbX={50} pcbY={50} text="(50,50)" fontSize={2} anchorAlignment="top_right" />

      {/* Anchor position marker - positioned at the exact anchor point */}
      <silkscreentext
        pcbX={30}
        pcbY={30}
        text="⊗ ANCHOR(30,30)"
        fontSize={2.5}
        anchorAlignment="bottom_right"
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
