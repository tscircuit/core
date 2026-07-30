import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * Bug: A trace connecting a port to itself is accepted silently
 * (#2859)
 *
 * When a trace's from and to resolve to the same port, no error
 * is emitted. The source_trace lists the same port twice and the
 * trace can never be routed — but the user gets no feedback.
 *
 * Expected: a pcb_trace_error or source_trace_not_connected_error
 * Actual: silent acceptance with duplicate source_port_ids
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

    const sourceTraces = circuit.db.source_trace.list() as any[]
    for (const st of sourceTraces) {
      if (
        st.connected_source_port_ids?.length === 2 &&
        st.connected_source_port_ids[0] === st.connected_source_port_ids[1]
      ) {
        console.log(
          `source_trace has duplicate port: ${st.connected_source_port_ids[0]}`,
        )
      }
    }

    const traceErrors = circuit.db.pcb_trace_error.list()
    expect(traceErrors.length).toBeGreaterThan(0)
  },
)
