import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Ensure TestPoint renders correctly */
test("<testpoint /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint
        name="TP1"
        holeDiameter="0.6mm"
        footprintVariant="through_hole"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
