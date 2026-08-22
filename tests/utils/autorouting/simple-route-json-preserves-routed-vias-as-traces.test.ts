import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("preserved routed vias stay in SRJ traces instead of obstacles", () => {
  const childSubcircuitId = "subcircuit_source_group_0"
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 4,
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_child_routed",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_child_routed",
      source_trace_id: "source_trace_child_routed",
      subcircuit_id: childSubcircuitId,
      route: [
        {
          route_type: "wire",
          x: -1,
          y: 0,
          width: 0.1,
          layer: "top",
        },
        {
          route_type: "via",
          x: 0,
          y: 0,
          from_layer: "top",
          to_layer: "inner1",
          via_diameter: 0.9,
          via_hole_diameter: 0.4,
        },
        {
          route_type: "wire",
          x: 0,
          y: 0,
          width: 0.1,
          layer: "inner1",
        },
        {
          route_type: "wire",
          x: 1,
          y: 0,
          width: 0.1,
          layer: "inner1",
        },
      ],
    } as any,
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_in_preserved_trace",
      pcb_trace_id: "pcb_trace_child_routed",
      subcircuit_id: childSubcircuitId,
      x: 0,
      y: 0,
      outer_diameter: 0.9,
      hole_diameter: 0.4,
      layers: ["top", "inner1"],
    } as any,
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_separate_span",
      pcb_trace_id: "pcb_trace_child_routed",
      subcircuit_id: childSubcircuitId,
      x: 0,
      y: 0,
      outer_diameter: 0.5,
      hole_diameter: 0.2,
      layers: ["inner2", "bottom"],
    } as any,
    {
      type: "pcb_via",
      pcb_via_id: "pcb_via_separate_geometry",
      pcb_trace_id: "pcb_trace_child_routed",
      subcircuit_id: childSubcircuitId,
      x: 2,
      y: 2,
      outer_diameter: 0.5,
      hole_diameter: 0.2,
      layers: ["top", "bottom"],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })

  expect(simpleRouteJson.traces).toEqual([
    expect.objectContaining({
      pcb_trace_id: "pcb_trace_child_routed",
      route: expect.arrayContaining([
        {
          route_type: "via",
          x: 0,
          y: 0,
          from_layer: "top",
          to_layer: "inner1",
          via_diameter: 0.9,
          via_hole_diameter: 0.4,
        },
      ]),
    }),
  ])
  expect(
    simpleRouteJson.obstacles.flatMap(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id ?? [],
    ),
  ).toEqual(["pcb_via_separate_span", "pcb_via_separate_geometry"])
})
