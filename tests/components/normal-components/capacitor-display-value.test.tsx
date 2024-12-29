import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor display_value property", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  })
  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_value).toBe("10µF")
})
