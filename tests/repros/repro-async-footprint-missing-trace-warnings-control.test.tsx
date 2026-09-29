import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a synchronous 0603 footprint does not warn on connected resistor pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(2)
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)
})
