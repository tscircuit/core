import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Test for Design Rule Check (DRC) phase with async autorouting
 *
 * This test verifies that DRC errors are properly detected and updated
 * when traces change during async autorouting. It creates a circuit with
 * components that will be connected by traces that cross each other,
 * and verifies that the DRC phase correctly identifies and reports
 * trace overlaps as errors after async autorouting.
 */
test("design rule check detects crossing traces after async autorouting", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with components that will be connected by crossing traces
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      // Use async autorouting with a custom algorithm that generates crossing traces
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (simpleRouteJson: SimpleRouteJson) => {
          // Simulate async delay
          await new Promise((resolve) => setTimeout(resolve, 100))

          return {
            on: (event: string, callback: any) => {
              if (event === "complete") {
                // Return crossing traces that will trigger DRC errors
                callback({
                  traces: [
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
                  ],
                })
              }
            },
            start: () => {},
            stop: () => {},
          }
        },
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

  // Ensure the circuit is fully rendered and async autorouting is complete
  await circuit.renderUntilSettled()

  // Get all DRC errors from the database
  const drcErrors = circuit.db.pcb_trace_error.list()

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
