import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace maxViaCount is emitted on the source trace", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" />
      <resistor name="R2" resistance="1k" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" maxViaCount={2} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace.list()[0].max_via_count).toBe(2)
})
