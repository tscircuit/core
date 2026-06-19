import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance="1k" schX={-6} schY={0} schRotation={0} />
      <resistor name="R2" resistance="1k" schX={-2} schY={0} schRotation={90} />
      <resistor name="R3" resistance="1k" schX={2} schY={0} schRotation={180} />
      <resistor name="R4" resistance="1k" schX={6} schY={0} schRotation={270} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
