import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace width too large for component spacing should still attempt routing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Components extremely close together */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={0.3}
        pcbY={0}
      />
      {/* Trace width larger than the distance between components */}
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness="1mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()

  // Even with impossible trace width, the system should attempt routing
  // and either succeed with creative routing or fail gracefully
  expect(traces.length).toBeGreaterThan(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})