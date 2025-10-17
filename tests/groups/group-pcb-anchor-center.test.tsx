import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with center anchor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      {/* Reference markers */}
      <silkscreentext pcbX={0} pcbY={0} text="(0,0)" fontSize={1.5} />
      <silkscreentext pcbX={5} pcbY={5} text="(5,5)" fontSize={1.5} />
      <silkscreentext pcbX={10} pcbY={10} text="(10,10)" fontSize={1.5} />

      {/* Anchor position marker */}
      <silkscreentext
        pcbX={20}
        pcbY={25}
        text="ANCHOR(20,25) center"
        fontSize={1.5}
        anchorAlignment="center"
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

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
