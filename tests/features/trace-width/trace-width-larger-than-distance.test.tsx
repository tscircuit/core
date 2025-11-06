import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace width larger than distance between components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Components placed extremely close together */}
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
        pcbX={0.2}
        pcbY={0}
      />
      {/* Trace width (1mm) larger than component spacing (0.2mm) */}
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness="1mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()

  // Even with physically impossible trace width, the system should attempt routing
  // and either succeed with creative routing or fail gracefully
  expect(traces.length).toBeGreaterThan(0)

  // The trace should exist but may not route successfully due to physical constraints
  const pcbTrace = traces[0]
  if (pcbTrace) {
    // If routed, verify the trace has some width (may be constrained by obstacles)
    expect(pcbTrace.route.length).toBeGreaterThan(0)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})