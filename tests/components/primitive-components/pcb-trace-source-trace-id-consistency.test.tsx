import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_trace.source_trace_id matches pcb_trace_id embedded id and does not pick unrelated trace", async () => {
  const { circuit } = getTestFixture()

  // Two pairs of resistors on the same net or adjacent traces
  circuit.add(
    <board width="30mm" height="30mm" autorouter="default">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={5}
        layer="top"
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={5}
        layer="bottom"
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={-5}
        layer="top"
      />
      <resistor
        name="R4"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={-5}
        layer="bottom"
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R3 > .pin2" to=".R4 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(0)

  for (const t of pcbTraces) {
    const embedded = t.pcb_trace_id.replace(/_\d+$/, "")
    if (embedded.startsWith("source_trace") && t.source_trace_id) {
      expect(t.source_trace_id).toBe(embedded)
    }
  }

  const pcbVias = circuit.db.pcb_via.list()
  for (const v of pcbVias) {
    const parentTrace = circuit.db.pcb_trace.get(v.pcb_trace_id!)
    if (parentTrace?.source_trace_id) {
      const sourceTrace = circuit.db.source_trace.get(
        parentTrace.source_trace_id,
      )
      if (sourceTrace?.subcircuit_connectivity_map_key) {
        expect(v.subcircuit_connectivity_map_key).toBe(
          sourceTrace.subcircuit_connectivity_map_key,
        )
      }
    }
  }
})
