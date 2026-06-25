import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fuse schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <fuse name="F1" currentRating="2A" schX={-6} schY={0} schRotation={0} />
      <fuse name="F2" currentRating="2A" schX={-2} schY={0} schRotation={90} />
      <fuse name="F3" currentRating="2A" schX={2} schY={0} schRotation={180} />
      <fuse name="F4" currentRating="2A" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
