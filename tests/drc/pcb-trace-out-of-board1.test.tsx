import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("design rule check detects trace crossing U-shaped board cutout", async () => {
  const { circuit } = getTestFixture()

  // Create a U-shaped board outline with a cutout in the middle
  circuit.add(
    <board
      outline={[
        // Left vertical side
        { x: -5, y: -5 },
        { x: -5, y: 5 },
        // Top left corner
        { x: -2, y: 5 },
        { x: -2, y: 2 },
        // Inner cutout (U-shape)
        { x: 2, y: 2 },
        { x: 2, y: 5 },
        // Top right corner
        { x: 5, y: 5 },
        // Right vertical side
        { x: 5, y: -5 },
        // Bottom side
        { x: -5, y: -5 },
      ]}
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (simpleRouteJson: SimpleRouteJson) => {
            // Create a trace that goes straight across the U cutout
            // This trace crosses the empty space where the board doesn't exist
            return [
              {
                type: "pcb_trace",
                pcb_trace_id: "trace_across_cutout",
                connection_name: "source_trace_0",
                route: [
                  {
                    route_type: "wire",
                    x: -3,
                    y: 3.5, // Left side of the U
                    width: 0.15,
                    layer: "top",
                  },
                  {
                    route_type: "wire",
                    x: 3,
                    y: 3.5, // Right side of the U (crosses the cutout)
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
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pcbX={-3}
        pcbY={3.5}
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="10k"
        pcbX={3}
        pcbY={3.5}
      />

      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  const pcbTraceErrors = circuitJson.filter(
    (el) => el.type === "pcb_trace_error",
  )

  expect(pcbTraces.length).toBe(1)

  // Find the trace out of board error specifically
  const traceOutOfBoardErrors = pcbTraceErrors.filter((error: any) =>
    error.message?.includes("Trace too close to board edge"),
  )

  expect(traceOutOfBoardErrors.length).toBeGreaterThan(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
