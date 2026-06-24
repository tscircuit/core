import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <inductor
        name="L1"
        inductance="10uH"
        schX={-6}
        schY={0}
        schRotation={0}
      />
      <inductor
        name="L2"
        inductance="10uH"
        schX={-2}
        schY={0}
        schRotation={90}
      />
      <inductor
        name="L3"
        inductance="10uH"
        schX={2}
        schY={0}
        schRotation={180}
      />
      <inductor
        name="L4"
        inductance="10uH"
        schX={6}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
