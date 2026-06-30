import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("switch schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <switch name="SW1" type="spst" schX={-6} schY={0} schRotation={0} />
      <switch name="SW2" type="spdt" schX={-2} schY={0} schRotation={90} />
      <switch name="SW3" type="dpst" schX={2} schY={0} schRotation={180} />
      <switch name="SW4" type="dpdt" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
