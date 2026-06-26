import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("led schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <led name="LED1" schX={-6} schY={0} schRotation={0} />
      <led name="LED2" schX={-2} schY={0} schRotation={90} />
      <led name="LED3" schX={2} schY={0} schRotation={180} />
      <led name="LED4" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
