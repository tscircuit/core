import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-connected trace does not emit source_unnamed_trace_warning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from=".R1 > .pin1" to="net.GND" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_unnamed_trace_warning.list()).toHaveLength(0)
})
