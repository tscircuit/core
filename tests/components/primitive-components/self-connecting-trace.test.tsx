import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace connecting a port to itself emits source_trace_not_connected_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} />
      <net name="VCC" />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toMatch(/connects a port to itself/)

  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(2)
  expect(
    traces.some(
      (trace) =>
        trace.connected_source_port_ids.length === 2 &&
        new Set(trace.connected_source_port_ids).size === 1,
    ),
  ).toBe(false)
})

test("a trace from a port to a net is not flagged as a self-connection", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <net name="VCC" />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list().length).toBeGreaterThan(0)
})
