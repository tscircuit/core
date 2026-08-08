import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor parses SI current units and omits an unset rating", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="30mm" height="10mm">
      <inductor
        name="L1"
        inductance="10uH"
        maxCurrentRating="500mA"
        footprint="0402"
        pcbX={-8}
        schX={-4}
      />
      <inductor
        name="L2"
        inductance="10uH"
        maxCurrentRating={3}
        footprint="0402"
        pcbX={0}
        schX={0}
      />
      <inductor
        name="L3"
        inductance="10uH"
        footprint="0402"
        pcbX={8}
        schX={4}
      />
    </board>,
  )

  project.render()

  const inductors = project.db.source_component.list({
    ftype: "simple_inductor",
  }) as Array<{
    name: string
    ftype: "simple_inductor"
    max_current_rating?: number
  }>

  const byName = Object.fromEntries(inductors.map((i) => [i.name, i]))

  // "500mA" must convert to 0.5A, not 500 (the naive parseFloat result)
  expect(byName.L1.max_current_rating).toBe(0.5)
  // a plain number passes straight through
  expect(byName.L2.max_current_rating).toBe(3)
  // no prop means no rating is written
  expect(byName.L3.max_current_rating).toBeUndefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
