import { expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import {
  manualViaTransitionCases,
  renderManualViaTransition,
} from "tests/fixtures/manual-via-transition"

test("manual vias accept physical barrel contact even when the logical fromLayer differs", async () => {
  for (const api of ["pcbPath", "pcbPaths"] as const) {
    for (const scenario of manualViaTransitionCases.filter(
      (scenario) => !scenario.invalid,
    )) {
      const circuit = await renderManualViaTransition(api, scenario)
      expect(
        circuit
          .getCircuitJson()
          .filter((element) => element.type.includes("error")),
      ).toEqual([])
      const traces = circuit.db.pcb_trace.list()
      expect(traces).toHaveLength(1)
      const vias = circuit.db.pcb_via.list()
      expect(vias).toHaveLength("incomingLayer" in scenario ? 3 : 2)
      // Check emitted physical contact, independently of logical from_layer equality.
      let incomingLayer: LayerRef = "top"
      for (const point of traces[0]!.route) {
        if (point.route_type === "wire") incomingLayer = point.layer
        if (point.route_type !== "via") continue
        const via = vias.find((via) => via.x === point.x && via.y === point.y)!
        expect(via.layers).toContain(incomingLayer)
        expect(via.layers).toContain(point.to_layer)
        incomingLayer = point.to_layer
      }
      if (scenario.toLayer === "top") {
        expect(vias["incomingLayer" in scenario ? 1 : 0]!.layers).toEqual([
          "bottom",
          "inner2",
          "inner1",
          "top",
        ])
      }
    }
  }
})
