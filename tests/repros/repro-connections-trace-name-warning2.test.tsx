import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an explicitly written unnamed trace still warns", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  expect(warnings).toHaveLength(1)
})
