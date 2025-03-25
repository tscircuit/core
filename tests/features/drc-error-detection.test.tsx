import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"

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
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      // Create a custom autorouter that generates crossing traces
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (simpleRouteJson: SimpleRouteJson) => {
            // Create crossing traces that will trigger DRC errors
            return [
              // Horizontal trace from left to right
              {
                type: "pcb_trace",
                pcb_trace_id: "trace_horizontal",
                connection_name: "source_trace_0",
                route: [
                  {
                    route_type: "wire",
                    x: -3.5,
                    y: 0,
                    width: 0.15,
                    layer: "top",
                  },
                  {
                    route_type: "wire",
                    x: 3.5,
                    y: 0,
                    width: 0.15,
                    layer: "top",
                  },
                ],
              },
              // Vertical trace from bottom to top (crosses the horizontal trace)
              {
                type: "pcb_trace",
                pcb_trace_id: "trace_vertical",
                connection_name: "source_trace_1",
                route: [
                  {
                    route_type: "wire",
                    x: 0,
                    y: -3,
                    width: 0.15,
                    layer: "top",
                  },
                  {
                    route_type: "wire",
                    x: 0,
                    y: 3,
                    width: 0.15,
                    layer: "top",
                  },
                ],
              },
            ]
          },
        ),
      }}
    >
      {/* Four resistors forming a cross pattern */}
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

      {/* Connect resistors with traces that will cross in the center */}
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
      <trace from=".R3 > .pin1" to=".R4 > .pin2" />
    </board>,
  )

  // Ensure the circuit is fully rendered
  await circuit.renderUntilSettled()

  // Get the circuit JSON and manually run the DRC check
  const circuitJson = circuit.getCircuitJson()

  // Run the DRC check function directly
  const drcErrors = checkEachPcbTraceNonOverlapping(circuitJson)

  // Insert the DRC errors into the database for visualization
  for (const error of drcErrors) {
    circuit.db.pcb_trace_error.insert(error)
  }

  // Verify that at least one DRC error was detected
  expect(drcErrors.length).toBeGreaterThan(0)

  // Check for trace overlap DRC error
  const traceOverlapError = drcErrors.find(
    (error) =>
      error.message.includes("overlaps with trace") &&
      error.pcb_trace_id === "trace_horizontal" &&
      error.pcb_trace_error_id === "overlap_trace_horizontal_trace_vertical",
  )

  expect(traceOverlapError).toBeDefined()

  // Save the rendered PCB with errors as a snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
