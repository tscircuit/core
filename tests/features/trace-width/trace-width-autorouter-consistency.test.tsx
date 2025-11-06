import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace width consistency across different autorouter algorithms", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm" autorouter="auto-local">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={0}
      />
      {/* Different trace widths in same routing context */}
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness="0.2mm"
      />
      <trace
        from=".R2 > .pin2"
        to=".R3 > .pin1"
        thickness="0.4mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(2)

  // Verify each trace maintains its specified width
  const trace1 = traces.find(t => t.source_trace_id?.includes("R1"))
  const trace2 = traces.find(t => t.source_trace_id?.includes("R2"))

  if (trace1) {
    expect(
      trace1.route
        .filter((segment) => segment.route_type === "wire")
        .every((segment) => segment.width === 0.2),
    ).toBe(true)
  }

  if (trace2) {
    expect(
      trace2.route
        .filter((segment) => segment.route_type === "wire")
        .every((segment) => segment.width === 0.4),
    ).toBe(true)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})