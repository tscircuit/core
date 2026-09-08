import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace connecting a port to itself emits source_trace_not_connected_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toMatch(/itself/)

  const traces = circuit.db.source_trace.list()
  expect(
    traces.some(
      (trace) =>
        trace.connected_source_port_ids.length === 2 &&
        trace.connected_source_port_ids[0] ===
          trace.connected_source_port_ids[1],
    ),
  ).toBe(false)
})
