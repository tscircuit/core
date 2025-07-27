import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export default test("pinheader pinCount default footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="J1" pinCount={3} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(3)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
