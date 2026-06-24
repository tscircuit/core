import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resonator schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resonator
        name="X1"
        frequency="16MHz"
        loadCapacitance="20pF"
        schX={-6}
        schY={0}
        schRotation={0}
      />
      <resonator
        name="X2"
        frequency="16MHz"
        loadCapacitance="20pF"
        schX={-2}
        schY={0}
        schRotation={90}
      />
      <resonator
        name="X3"
        frequency="16MHz"
        loadCapacitance="20pF"
        schX={2}
        schY={0}
        schRotation={180}
      />
      <resonator
        name="X4"
        frequency="16MHz"
        loadCapacitance="20pF"
        schX={6}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
