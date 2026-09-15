import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty connections target reports an error and still renders the board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  project.render()

  const errors = project.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('empty connections target for pin "pin1"')

  // The sibling connection still produces its trace, and the board renders.
  expect(project.db.source_trace.list()).toHaveLength(1)
  expect(project.db.source_component.list()).toHaveLength(2)
})

test("whitespace-only connections target is treated as empty", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "   " }}
      />
    </board>,
  )

  project.render()

  expect(project.db.source_component_misconfigured_error.list()).toHaveLength(1)
  expect(project.db.source_trace.list()).toHaveLength(0)
})
