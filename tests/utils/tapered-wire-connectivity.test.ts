import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"

test("a pour touching only the old constant-width fallback remains floating beside a taper", () => {
  const circuitJson = [
    { type: "source_net", source_net_id: "source_net_1", name: "GND" },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_1",
      name: "1",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_net_ids: ["source_net_1"],
      connected_source_port_ids: ["source_port_1"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      source_port_id: "source_port_1",
      pcb_component_id: "pcb_component_1",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_1",
      pcb_port_id: "pcb_port_1",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.2,
      height: 0.2,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_1",
      source_trace_id: "source_trace_1",
      route: [
        {
          route_type: "wire",
          x: 0,
          y: 0,
          width: 2,
          start_width: 2,
          end_width: 0.2,
          width_interpolation_mode: "quadratic",
          layer: "top",
        },
        { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "top" },
      ],
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pcb_copper_pour_1",
      source_net_id: "source_net_1",
      layer: "top",
      shape: "rect",
      center: { x: 3.5, y: 0.65 },
      width: 0.2,
      height: 0.2,
    },
  ] as AnyCircuitElement[]
  expect(
    findFloatingCopper(circuitJson).floatingPourIds.has("pcb_copper_pour_1"),
  ).toBe(true)
  const connected = structuredClone(circuitJson)
  const pour = connected.find((e) => e.type === "pcb_copper_pour")!
  if (pour.shape !== "rect") throw new Error("Expected rectangular pour")
  pour.center.y = 0
  expect(
    findFloatingCopper(connected).floatingPourIds.has("pcb_copper_pour_1"),
  ).toBe(false)
})
