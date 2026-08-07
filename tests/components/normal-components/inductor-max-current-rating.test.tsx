import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor writes max_current_rating from a string prop", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="12mm" height="10mm">
      <inductor
        name="L2"
        inductance="10uH"
        maxCurrentRating="2A"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const inductors = project.db.source_component.list({
    ftype: "simple_inductor",
  }) as Array<{
    ftype: "simple_inductor"
    max_current_rating?: number
  }>

  expect(inductors).toHaveLength(1)
  expect(inductors[0].max_current_rating).toBe(2)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
