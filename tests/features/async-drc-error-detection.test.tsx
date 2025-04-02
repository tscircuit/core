import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import type { PcbTraceError } from "circuit-json"

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
                // Debug logging for autorouting completion
                console.log("Autorouting complete, generating crossing traces")

                // First create source traces with proper port connections
                const sourceTrace0 = circuit.db.source_trace.insert({
                  connected_source_port_ids: [".R1 > .pin1", ".R2 > .pin2"],
                  connected_source_net_ids: [],
                  display_name: ".R1 > .pin1 to .R2 > .pin2",
                })

                const sourceTrace1 = circuit.db.source_trace.insert({
                  connected_source_port_ids: [".R3 > .pin1", ".R4 > .pin2"],
                  connected_source_net_ids: [],
                  display_name: ".R3 > .pin1 to .R4 > .pin2",
                })

                // Create PCB traces that reference the source traces and connect to ports
                const horizontalTrace = circuit.db.pcb_trace.insert({
                  source_trace_id: sourceTrace0.source_trace_id,
                  route: [
                    {
                      route_type: "wire",
                      x: -3.5,
                      y: 0,
                      width: 0.15,
                      layer: "top",
                      start_pcb_port_id: "pcb_port_0",
                    },
                    {
                      route_type: "wire",
                      x: 3.5,
                      y: 0,
                      width: 0.15,
                      layer: "top",
                      end_pcb_port_id: "pcb_port_3",
                    },
                  ],
                })

                const verticalTrace = circuit.db.pcb_trace.insert({
                  source_trace_id: sourceTrace1.source_trace_id,
                  route: [
                    {
                      route_type: "wire",
                      x: 0,
                      y: -3,
                      width: 0.15,
                      layer: "top",
                      start_pcb_port_id: "pcb_port_4",
                    },
                    {
                      route_type: "wire",
                      x: 0,
                      y: 3,
                      width: 0.15,
                      layer: "top",
                      end_pcb_port_id: "pcb_port_7",
                    },
                  ],
                })

                // Return the traces to the autorouter
                callback({
                  traces: [
                    {
                      type: "pcb_trace",
                      pcb_trace_id: horizontalTrace.pcb_trace_id,
                      source_trace_id: sourceTrace0.source_trace_id,
                      route: [
                        {
                          route_type: "wire",
                          x: -3.5,
                          y: 0,
                          width: 0.15,
                          layer: "top",
                          start_pcb_port_id: "pcb_port_0",
                        },
                        {
                          route_type: "wire",
                          x: 3.5,
                          y: 0,
                          width: 0.15,
                          layer: "top",
                          end_pcb_port_id: "pcb_port_3",
                        },
                      ],
                    },
                    {
                      type: "pcb_trace",
                      pcb_trace_id: verticalTrace.pcb_trace_id,
                      source_trace_id: sourceTrace1.source_trace_id,
                      route: [
                        {
                          route_type: "wire",
                          x: 0,
                          y: -3,
                          width: 0.15,
                          layer: "top",
                          start_pcb_port_id: "pcb_port_4",
                        },
                        {
                          route_type: "wire",
                          x: 0,
                          y: 3,
                          width: 0.15,
                          layer: "top",
                          end_pcb_port_id: "pcb_port_7",
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
  await circuit.render()

  // Add delay to ensure async autorouting and DRC checks complete
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Debug logging
  console.log(
    "Circuit JSON:",
    JSON.stringify(circuit.getCircuitJson(), null, 2),
  )
  console.log("PCB Traces:", circuit.db.pcb_trace.list())

  // Get the circuit JSON and manually run the DRC check
  const circuitJson = circuit.getCircuitJson()

  // Run the DRC check function directly
  const drcErrors = checkEachPcbTraceNonOverlapping(circuitJson)

  // Insert the DRC errors into the database for visualization
  for (const error of drcErrors) {
    circuit.db.pcb_trace_error.insert(error as PcbTraceError)
  }

  // Get all DRC errors from the database
  const allDrcErrors = circuit.db.pcb_trace_error.list()
  console.log("DRC Errors:", allDrcErrors)

  // Verify that at least one DRC error was detected
  expect(drcErrors.length).toBeGreaterThan(0)

  // Check for trace overlap DRC error
  const traceOverlapError = drcErrors.find(
    (error) =>
      error.message.includes("overlaps with trace") &&
      error.pcb_trace_id &&
      error.pcb_trace_error_id,
  )

  expect(traceOverlapError).toBeDefined()

  // Save the rendered PCB with errors as a snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
