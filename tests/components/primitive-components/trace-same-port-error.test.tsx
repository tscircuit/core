import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A trace whose "from" and "to" resolve to the same port is a copy-paste
// mistake — it must surface a source_trace_not_connected_error instead of
// silently emitting a source_trace that can never be routed.

test("trace connecting a port to itself raises a not-connected error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_trace_not_connected_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0]!.message).toContain("connects the same port on both ends")
  expect(circuit.db.source_trace.list()).toHaveLength(0)
})
