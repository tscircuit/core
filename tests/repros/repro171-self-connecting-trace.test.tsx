import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * Bug: A trace connecting a port to itself is accepted silently
 * (#2859)
 *
 * When <trace from=".R1 > .pin1" to=".R1 > .pin1" /> resolves
 * both ends to the same port, a source_trace is created with the
 * same port listed twice. No PCB trace can be routed (no distance
 * between endpoints). No source_trace_not_connected_error is
 * emitted. Instead a pcb_trace_missing_error is produced.
 */
test.failing(
  "trace connecting a port to itself should produce an error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <trace from=".R1 > .pin1" to=".R1 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    // A source_trace was created but with the same port on both ends
    const sourceTraces = circuit.db.source_trace.list() as any[]
    expect(sourceTraces.length).toBe(1)
    expect(sourceTraces[0].connected_source_port_ids).toEqual([
      sourceTraces[0].connected_source_port_ids[0],
      sourceTraces[0].connected_source_port_ids[0],
    ])
    console.log(
      `source_trace has duplicate port: ${sourceTraces[0].connected_source_port_ids[0]}`,
    )

    // No PCB trace was created (nothing to route between same point)
    const pcbTraces = circuit.db.pcb_trace.list()
    expect(pcbTraces.length).toBe(0)

    // A pcb_trace_missing_error is produced downstream
    const missingTraceErrors = circuit.db.pcb_trace_missing_error.list()
    expect(missingTraceErrors.length).toBeGreaterThan(0)
    console.log(
      `pcb_trace_missing_error: ${(missingTraceErrors[0] as any).message}`,
    )

    // No source_trace_not_connected_error is emitted
    const directErrors = circuit.db.source_trace_not_connected_error.list()
    expect(directErrors.length).toBeGreaterThan(0)
  },
)
