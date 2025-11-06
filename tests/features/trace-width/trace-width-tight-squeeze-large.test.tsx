import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("tight squeeze scenario with large trace width causing routing challenges", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Components placed very close together */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-1}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={1} pcbY={0} />
      {/* Very large trace width that may be challenging to route */}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" thickness="2mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBeGreaterThan(0)

  // The trace should either route successfully or fail gracefully
  // In tight spaces, the autorouter may need to use creative routing
  const pcbTrace = traces[0]
  if (pcbTrace) {
    // If routed, verify the trace has some width (may be reduced)
    expect(pcbTrace.route.length).toBeGreaterThan(0)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
