import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A trace whose ends resolve to the same port is a copy-paste error.
// It should emit a source_trace_not_connected_error rather than silently
// inserting an unroutable source_trace with duplicate ports (#2859).

test("trace connecting a port to itself raises a not-connected error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0]!.message).toContain("connects the same port on both ends")
  expect(circuit.db.source_trace.list()).toHaveLength(0)
})

test("trace connecting a port to a net is allowed", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <trace from=".R1 > .pin1" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors).toHaveLength(0)
  expect(circuit.db.source_trace.list().length).toBeGreaterThanOrEqual(1)
})

test("trace connecting two distinct ports is allowed", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors).toHaveLength(0)
  expect(circuit.db.source_trace.list().length).toBeGreaterThanOrEqual(1)
})
