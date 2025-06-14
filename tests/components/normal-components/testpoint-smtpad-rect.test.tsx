import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Ensure TestPoint with SMT rectangular pad renders correctly */
test("<testpoint /> with SMT rectangular pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="rect"
        width="2mm"
        height="1mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})