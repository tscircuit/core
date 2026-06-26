import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mosfet schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        schX={-9}
        schY={0}
        schRotation={0}
      />
      <mosfet
        name="Q2"
        channelType="n"
        mosfetMode="enhancement"
        schX={-3}
        schY={0}
        schRotation={90}
      />
      <mosfet
        name="Q3"
        channelType="n"
        mosfetMode="enhancement"
        schX={3}
        schY={0}
        schRotation={180}
      />
      <mosfet
        name="Q4"
        channelType="n"
        mosfetMode="enhancement"
        schX={9}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
