import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces created by a resistor pullup do not warn about a missing name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-4}
        pcbY={0}
        pullupFor=".U1 > .pin1"
        pullupTo=".U1 > .pin2"
      />
      <chip name="U1" footprint="soic8" pcbX={4} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(2)

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  // The pullup traces are derived from the resistor props, so there is no
  // element for the user to have named.
  expect(warnings).toHaveLength(0)
})
