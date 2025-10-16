import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with center anchor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <group
        name="G2"
        pcbX={20}
        pcbY={25}
        pcbPositionAnchor="center"
        subcircuit
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.list()[0]

  expect(pcbGroup.anchor_position).toEqual({ x: 20, y: 25 })
  expect(pcbGroup.anchor_alignment).toBe("center")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
