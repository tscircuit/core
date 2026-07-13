import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit port connects an internal component to an external component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <subcircuit name="FILTER" showAsSchematicBox schX={-2}>
        <resistor name="R_INTERNAL" resistance="10k" footprint="0402" />
        <port name="INPUT" direction="right" connectsTo="R_INTERNAL.pin1" />
      </subcircuit>
      <resistor name="R_EXTERNAL" resistance="1k" footprint="0402" schX={0} />
      <trace
        name="FILTER_INPUT"
        from=".R_EXTERNAL > .pin1"
        to=".FILTER > .INPUT"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
