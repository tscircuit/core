import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("voltagesource schematic text bounding box at all rotations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <voltagesource
        name="VBUS20_ECOK_IN_OUT"
        voltage={5}
        schX={-6}
        schY={0}
        schRotation={0}
      />
      <voltagesource
        name="VBUS5_ECOK_IN_OUT"
        voltage={5}
        schX={-2}
        schY={0}
        schRotation={90}
      />
      <voltagesource
        name="VBUS1_ECOK_IN_OUT"
        voltage={5}
        schX={2}
        schY={0}
        schRotation={180}
      />
      <voltagesource
        name="VBUS3_ECOK_IN_OUT"
        voltage={5}
        schX={6}
        schY={0}
        schRotation={270}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
