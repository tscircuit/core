import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces created by a port connectsTo do not warn about a missing name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <subcircuit name="FILTER" showAsSchematicBox schX={-2}>
        <resistor name="R_INTERNAL" resistance="10k" footprint="0402" />
        <port name="INPUT" direction="right" connectsTo="R_INTERNAL.pin1" />
      </subcircuit>
      <resistor name="R_EXTERNAL" resistance="1k" footprint="0402" schX={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  // The trace is derived from the port prop, so there is no element for the
  // user to have named.
  expect(warnings).toHaveLength(0)
})
