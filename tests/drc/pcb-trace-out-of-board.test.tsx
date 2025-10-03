import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Test for checking that traces don't leave or intersect the board outline
 *
 * This test creates a circuit with a trace that intentionally extends beyond
 * the board boundary to trigger a DRC error for traces outside the board.
 */
test("design rule check detects traces outside board boundary", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with a small board and traces that extend beyond it
  circuit.add(
    <board
      width="10mm"
      height="10mm"
      // Create a custom autorouter that generates traces outside the board
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (simpleRouteJson: SimpleRouteJson) => {
            // Create a trace that extends beyond the board boundary
            // Board is 10mm x 10mm centered at (0, 0), so boundaries are at ±5mm
            return [
              {
                type: "pcb_trace",
                pcb_trace_id: "trace_out_of_board",
                connection_name: "source_trace_0",
                route: [
                  {
                    route_type: "wire",
                    x: -2,
                    y: 0,
                    width: 0.15,
                    layer: "top",
                  },
                  {
                    route_type: "wire",
                    x: 8, // This extends beyond the board (past 5mm boundary)
                    y: 0,
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
      {/* Two resistors that will be connected by a trace extending beyond the board */}
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" footprint="0402" resistance="10k" pcbX={3} pcbY={0} />

      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  const pcbTraceErrors = circuitJson.filter(
    (el) => el.type === "pcb_trace_error",
  )

  expect(pcbTraces.length).toBeGreaterThan(0)

  // Find the trace out of board error specifically
  const traceOutOfBoardErrors = pcbTraceErrors.filter((error: any) =>
    error.message?.includes("Trace too close to board edge"),
  )

  expect(traceOutOfBoardErrors.length).toBe(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
