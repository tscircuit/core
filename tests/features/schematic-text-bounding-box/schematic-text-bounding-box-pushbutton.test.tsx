import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <pushbutton name="SW1" schX={-6} schY={0} schRotation={0} />
      <pushbutton name="SW2" schX={-2} schY={0} schRotation={90} />
      <pushbutton name="SW3" schX={2} schY={0} schRotation={180} />
      <pushbutton name="SW4" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
