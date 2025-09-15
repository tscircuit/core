import React from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure schPadding expands schematic border

test("group schematic border with padding", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <group
        name="G1"
        schWidth={4}
        schHeight={3}
        border={{ dashed: false }}
        schPadding={1}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schX={-1}
          schY={0}
        />
        <chip name="U1" footprint="soic8" schX={1} schY={0} />
        <trace from=".R1 > .pin1" to=".U1 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()

  const boxes = circuit.db.schematic_box.list()
  expect(boxes.length).toBe(1)
  expect(boxes[0].width).toBe(6)
  expect(boxes[0].height).toBe(5)
  expect(boxes[0].is_dashed).toBe(false)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
