import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

// This test ensures that the same-net via spacing DRC check is triggered
// when the autorouter returns vias that are too close together.
test("drc detects same-net vias that are too close", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (_: SimpleRouteJson) => {
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "trace1",
              connection_name: "source_trace_0",
              route: [
                { route_type: "wire", x: -1, y: 0, width: 0.15, layer: "top" },
                {
                  route_type: "via",
                  x: 0,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
                {
                  route_type: "via",
                  x: 0.7,
                  y: 0,
                  from_layer: "bottom",
                  to_layer: "top",
                },
                { route_type: "wire", x: 1, y: 0, width: 0.15, layer: "top" },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={-2} />
      <resistor name="R2" footprint="0402" resistance="10k" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = circuit.db.pcb_placement_error.list()
  expect(placementErrors.length).toBeGreaterThan(0)
  const viaError = placementErrors.find((e) =>
    e.pcb_placement_error_id.startsWith("same_net_vias_close_"),
  )
  expect(viaError).toBeDefined()
  expect(viaError?.message).toContain("too close")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
