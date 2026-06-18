import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <capacitor name="C1" capacitance="1uF" schX={-6} schY={0} schRotation={0} />
      <capacitor name="C2" capacitance="1uF" schX={-2} schY={0} schRotation={90} />
      <capacitor name="C3" capacitance="1uF" schX={2} schY={0} schRotation={180} />
      <capacitor name="C4" capacitance="1uF" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
