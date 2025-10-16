import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with top_left anchor should output anchor_position and anchor_alignment", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <group
        name="G1"
        pcbX={10}
        pcbY={15}
        pcbPositionAnchor="top_left"
        subcircuit
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
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

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
