import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net connectsTo reports an unresolved selector", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled schAutoLayoutEnabled>
      <net name="SIGNAL" connectsTo=".missing > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(1)
})
