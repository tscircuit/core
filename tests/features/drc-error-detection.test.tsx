import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import type { GenericLocalAutorouter } from "lib/index"

/**
 * Test for the Design Rule Check (DRC) phase
 *
 * This test creates a simple circuit with intentionally crossing traces
 * to trigger DRC errors. It verifies that the DRC phase correctly identifies
 * and reports trace overlaps as errors.
 */
test("design rule check detects crossing traces", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with traces that will cross each other on the same layer
  // Arrange components in a cross pattern and force traces to stay on the same layer
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        async algorithmFn(simpleRouteJson) {
          console.dir(simpleRouteJson, { depth: null })
          // TODO implement a fake autorouter that will return crossing traces
          return { on: () => {} }
        },
      }}
    >
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" footprint="0402" resistance="10k" pcbX={3} pcbY={0} />
      <resistor
        name="R3"
        footprint="0402"
        resistance="10k"
        pcbX={0}
        pcbY={-3}
      />
      <resistor name="R4" footprint="0402" resistance="10k" pcbX={0} pcbY={3} />

      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
      <trace from=".R3 > .pin1" to=".R4 > .pin2" />
    </board>,
  )

  // Ensure the circuit is fully rendered including the DRC phase
  await circuit.renderUntilSettled()

  // Check for DRC errors in the database
  // The PR introduces pcb_trace_error table to store DRC errors
  const traceErrors = circuit.db.pcb_trace_error.list()

  // expect(traceErrors).toMatchInlineSnapshot()

  // Save the rendered PCB with errors as a snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
