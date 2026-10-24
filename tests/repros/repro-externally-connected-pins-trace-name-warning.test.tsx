import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces created by externallyConnectedPins do not warn about a missing name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        externallyConnectedPins={[["1", "2"]]}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  // The traces are derived from the chip props, so there is no element for the
  // user to have named.
  expect(warnings).toHaveLength(0)
})
