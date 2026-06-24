import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crystal (four_pin) schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <crystal
        name="Y1"
        frequency="16MHz"
        loadCapacitance="20pF"
        pinVariant="four_pin"
        schX={-6}
        schY={0}
        schRotation={0}
      />
      <crystal
        name="Y2"
        frequency="16MHz"
        loadCapacitance="20pF"
        pinVariant="four_pin"
        schX={-2}
        schY={0}
        schRotation={90}
      />
      <crystal
        name="Y3"
        frequency="16MHz"
        loadCapacitance="20pF"
        pinVariant="four_pin"
        schX={2}
        schY={0}
        schRotation={180}
      />
      <crystal
        name="Y4"
        frequency="16MHz"
        loadCapacitance="20pF"
        pinVariant="four_pin"
        schX={6}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
