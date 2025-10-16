import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with bottom_right anchor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <group
        name="G4"
        pcbX={30}
        pcbY={30}
        pcbPositionAnchor="bottom_right"
        subcircuit
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.list()[0]

  expect(pcbGroup.anchor_position).toEqual({ x: 30, y: 30 })
  expect(pcbGroup.anchor_alignment).toBe("bottom_right")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
