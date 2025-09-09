import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("symbol renders schematic line", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <symbol>
        <schematicline x1={0} y1={0} x2={1} y2={0} />
      </symbol>
    </board>,
  )

  circuit.render()

  const lines = circuit.db.schematic_line.list()
  expect(lines).toHaveLength(1)
  expect(lines[0]).toMatchObject({ x1: 0, y1: 0, x2: 1, y2: 0 })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
