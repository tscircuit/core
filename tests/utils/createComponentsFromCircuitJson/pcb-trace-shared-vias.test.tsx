import { expect, test } from "bun:test"
import type { PcbTrace, PcbVia } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported traces reuse unassociated and shared vias at the same position and layer span", async () => {
  for (const { pcb_trace_id, layers, expectedViaCount } of [
    {
      pcb_trace_id: undefined,
      layers: ["bottom", "inner2", "inner1"],
      expectedViaCount: 1,
    },
    {
      pcb_trace_id: "first_trace",
      layers: ["bottom", "inner2", "inner1"],
      expectedViaCount: 1,
    },
    { pcb_trace_id: undefined, layers: ["top", "inner1"], expectedViaCount: 3 },
  ]) {
    const { circuit } = getTestFixture()
    const board = new Board({ width: 20, height: 10, layers: 4 })
    const traces = ["first_trace", "second_trace"].map(
      (pcb_trace_id) =>
        ({
          type: "pcb_trace",
          pcb_trace_id,
          route: [
            { route_type: "wire", x: -4, y: 0, layer: "bottom", width: 0.2 },
            { route_type: "wire", x: 4, y: 0, layer: "bottom", width: 0.2 },
            {
              route_type: "via",
              x: 4,
              y: 0,
              from_layer: "bottom",
              to_layer: "inner1",
              hole_diameter: 0.4,
              outer_diameter: 0.8,
            },
          ],
        }) satisfies PcbTrace,
    )
    const via = {
      type: "pcb_via",
      pcb_via_id: "physical_via",
      pcb_trace_id,
      x: 4,
      y: 0,
      layers,
      hole_diameter: 0.4,
      outer_diameter: 0.8,
    } satisfies PcbVia
    for (const primitive of createComponentsFromCircuitJson(
      { componentName: "", componentRotation: "0" },
      [...traces, via],
    )) {
      board.add(primitive)
    }
    circuit.add(board)
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(2)
    expect(circuit.db.pcb_via.list()).toHaveLength(expectedViaCount)
    expect(circuit.db.pcb_via.list()).toContainEqual(
      expect.objectContaining({
        x: via.x,
        y: via.y,
        layers: via.layers,
        hole_diameter: via.hole_diameter,
        outer_diameter: via.outer_diameter,
      }),
    )
  }
})
