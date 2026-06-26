import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("opamp schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <opamp name="U1" schX={-12} schY={0} schRotation={0} />
      <opamp name="U2" schX={-4} schY={0} schRotation={90} />
      <opamp name="U3" schX={4} schY={0} schRotation={180} />
      <opamp name="U4" schX={12} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
