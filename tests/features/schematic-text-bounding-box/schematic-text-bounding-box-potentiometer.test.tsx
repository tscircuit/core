import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("potentiometer schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <potentiometer
        name="RV1"
        maxResistance="10k"
        schX={-6}
        schY={0}
        schRotation={0}
      />
      <potentiometer
        name="RV2"
        maxResistance="10k"
        schX={-2}
        schY={0}
        schRotation={90}
      />
      <potentiometer
        name="RV3"
        maxResistance="10k"
        schX={2}
        schY={0}
        schRotation={180}
      />
      <potentiometer
        name="RV4"
        maxResistance="10k"
        schX={6}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
