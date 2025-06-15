import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Ensure TestPoint with SMT pad uses correct defaults */
test("<testpoint /> with SMT pad defaults", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint name="TP1" footprintVariant="pad" padShape="circle" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  // Should use default padDiameter of 1.2mm for circle
  const sourceComponent = circuit.db.source_component
    .list()
    .find((sc) => sc.name === "TP1")
  expect((sourceComponent as any)?.pad_diameter).toBe(1.2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
