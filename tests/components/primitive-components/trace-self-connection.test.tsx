import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace connecting a port to itself emits source_trace_not_connected_error (#2859)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0]?.message).toContain("connects a port to itself")

  const traces = circuit.db.source_trace.list()
  expect(traces.length).toBe(0)
})
