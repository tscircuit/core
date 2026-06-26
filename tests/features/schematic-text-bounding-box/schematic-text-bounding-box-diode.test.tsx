import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <diode name="D1" schX={-6} schY={0} schRotation={0} />
      <diode name="D2" schX={-2} schY={0} schRotation={90} />
      <diode name="D3" schX={2} schY={0} schRotation={180} />
      <diode name="D4" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
