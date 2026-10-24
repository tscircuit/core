import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces created by capacitor decoupling do not warn about a missing name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-4} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={4}
        pcbY={0}
        decouplingFor=".R1 > .pin1"
        decouplingTo=".R1 > .pin2"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(2)

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  // The decoupling traces are derived from the capacitor props, so there is no
  // element for the user to have named.
  expect(warnings).toHaveLength(0)
})
