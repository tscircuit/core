import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with bottom_right anchor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      {/* Reference markers */}
      <silkscreentext pcbX={0} pcbY={0} text="(0,0)" fontSize={1.5} />
      <silkscreentext pcbX={5} pcbY={5} text="(5,5)" fontSize={1.5} />
      <silkscreentext pcbX={10} pcbY={10} text="(10,10)" fontSize={1.5} />

      {/* Anchor position marker */}
      <silkscreentext
        pcbX={30}
        pcbY={30}
        text="ANCHOR(30,30) bottom_right"
        fontSize={1.5}
        anchorAlignment="center"
      />

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
