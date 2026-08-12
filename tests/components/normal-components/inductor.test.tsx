import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<inductor /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <inductor
        name="U1"
        inductance="10"
        maxCurrentRating="2A"
        footprint="axial_p0.3in"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_component.getWhere({ name: "U1" })).toMatchObject({
    ftype: "simple_inductor",
    inductance: "10",
    max_current_rating: 2,
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
