import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("transistor schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <transistor name="Q1" type="npn" schX={-9} schY={0} schRotation={0} />
      <transistor name="Q2" type="npn" schX={-3} schY={0} schRotation={90} />
      <transistor name="Q3" type="npn" schX={3} schY={0} schRotation={180} />
      <transistor name="Q4" type="npn" schX={9} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
