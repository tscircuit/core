import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Reproduces issue where schFacingDirection is ignored
// Expectation: pins should face left when schFacingDirection="left"

export default test("pinheader schFacingDirection left", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="J2"
        pinCount={4}
        schX={10}
        schY={2}
        schFacingDirection="left"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const directions = circuit.db.schematic_port
    .list()
    .map((p) => p.facing_direction)

  // pins should all face left
  expect(new Set(directions)).toEqual(new Set(["left"]))

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
