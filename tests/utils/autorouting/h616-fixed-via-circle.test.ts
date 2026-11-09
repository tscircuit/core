import { expect, test } from "bun:test"
import type {
  Obstacle,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

// Actual H616 DDR crop: right-handed board-world points in mm;
// +X right, +Y up, +Z above.
// The completed DDR_003 data trace and U1 P2/P3/R2/R3 pads retain their captured
// geometry and connectivity. The trace crop retains its three coincident points.
test("H616 fixed via keeps its native circular copper footprint", async () => {
  const pads: Obstacle[] = [
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_205",
        pcb_port_id: "pcb_port_205",
        source_port_name: "BALL_P2",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.989999999999997, y: 16.049999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_205",
        "connectivity_net9",
        "source_trace_3",
        "source_port_205",
        "source_port_297",
        "pcb_port_205",
        "pcb_smtpad_297",
        "pcb_port_297",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_206",
        pcb_port_id: "pcb_port_206",
        source_port_name: "BALL_P3",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.989999999999997, y: 15.399999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_206",
        "connectivity_net1126",
        "source_port_206",
        "pcb_port_206",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_221",
        pcb_port_id: "pcb_port_221",
        source_port_name: "BALL_R2",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.3399999999999972, y: 16.049999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_221",
        "connectivity_net139",
        "source_trace_45",
        "source_port_221",
        "source_port_299",
        "pcb_port_221",
        "pcb_smtpad_299",
        "pcb_port_299",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_222",
        pcb_port_id: "pcb_port_222",
        source_port_name: "BALL_R3",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.3399999999999972, y: 15.399999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_222",
        "connectivity_net133",
        "source_trace_43",
        "source_port_222",
        "source_port_311",
        "pcb_port_222",
        "pcb_smtpad_311",
        "pcb_port_311",
      ],
    },
  ]
  const capturedVia = {
    route_type: "via" as const,
    x: 1.6650000000000003,
    y: 15.725,
    from_layer: "top",
    to_layer: "inner1",
    layers: ["top", "inner1", "inner2", "bottom"],
    via_diameter: 0.35,
    via_hole_diameter: 0.15,
  }
  const fixedTrace = {
    type: "pcb_trace" as const,
    pcb_trace_id: "bus_lane_source_trace_3",
    connection_name: "source_trace_3",
    source_trace_id: "source_trace_3",
    route: [
      {
        route_type: "wire",
        x: capturedVia.x,
        y: capturedVia.y,
        layer: "top",
        width: 0.0975,
      },
      capturedVia,
      {
        route_type: "wire",
        x: capturedVia.x,
        y: capturedVia.y,
        layer: "inner1",
        width: 0.0975,
      },
    ] satisfies SimplifiedPcbTrace["route"],
  }
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.093,
    minViaDiameter: 0.35,
    minViaPadDiameter: 0.35,
    minViaHoleDiameter: 0.15,
    minTraceToPadEdgeClearance: 0.1,
    minViaEdgeToPadEdgeClearance: 0.1,
    allowBlindAndBuriedVias: false,
    allowViaInPad: false,
    bounds: { minX: 1, maxX: 2.33, minY: 15, maxY: 16.45 },
    obstacles: pads,
    connections: [],
    traces: [fixedTrace],
  }
  const before = structuredClone(input)
  const output = withFixedTraces(input, new Set([fixedTrace.pcb_trace_id]))
  const barrel = output.obstacles.at(-1)!
  expect(barrel).toMatchObject({
    type: "rect",
    center: { x: capturedVia.x, y: capturedVia.y },
    width: capturedVia.via_diameter,
    height: capturedVia.via_diameter,
    layers: capturedVia.layers,
    connectedTo: [fixedTrace.connection_name],
  })
  expect(output.obstacles.slice(0, pads.length)).toEqual(pads)
  expect(output.obstacles).toHaveLength(pads.length + 1)
  expect(output.traces).toEqual([])
  expect(input).toEqual(before)

  const foreignPad = pads[3]!
  const centerDistance = Math.hypot(
    capturedVia.x - foreignPad.center.x,
    capturedVia.y - foreignPad.center.y,
  )
  const nativeGap =
    centerDistance - capturedVia.via_diameter / 2 - foreignPad.width / 2
  expect(nativeGap).toBeGreaterThan(input.minViaEdgeToPadEdgeClearance!)
  expect(foreignPad.connectedTo).not.toContain(fixedTrace.connection_name!)

  // The SRJ visualizer draws every obstacle as a rectangle. Render this emitted
  // geometry directly so the snapshot can distinguish its optional circle shape.
  const nativeBarrel: Obstacle = {
    type: "rect",
    shape: "circle",
    center: { x: capturedVia.x, y: capturedVia.y },
    width: capturedVia.via_diameter,
    height: capturedVia.via_diameter,
    layers: capturedVia.layers,
    connectedTo: [fixedTrace.connection_name],
  }
  const panels = [
    { title: "Native completed data copper", x: 45, via: nativeBarrel },
    { title: "Core fixed-trace routing obstacle", x: 585, via: barrel },
  ]
    .map(({ title, x, via }) => {
      const scale = 300
      const px = (worldX: number): number =>
        x + (worldX - input.bounds.minX) * scale
      const py = (worldY: number): number =>
        105 + (input.bounds.maxY - worldY) * scale
      const circular = via.shape === "circle"
      const dx = Math.abs(via.center.x - foreignPad.center.x)
      const dy = Math.abs(via.center.y - foreignPad.center.y)
      const gap = circular
        ? Math.hypot(dx, dy) - via.width / 2 - foreignPad.width / 2
        : Math.hypot(
            Math.max(0, dx - via.width / 2),
            Math.max(0, dy - via.height / 2),
          ) -
          foreignPad.width / 2
      const color =
        gap >= input.minViaEdgeToPadEdgeClearance! ? "#166534" : "#b91c1c"
      const padShapes = pads
        .map(
          (pad) =>
            `<circle cx="${px(pad.center.x)}" cy="${py(pad.center.y)}" r="${(pad.width * scale) / 2}" fill="#fee2e2" stroke="#b91c1c"/><text x="${px(pad.center.x)}" y="${py(pad.center.y) + 6}" text-anchor="middle" font-size="18">${pad.circuitJsonMetadata!.source_port_name!.replace("BALL_", "")}</text>`,
        )
        .join("")
      const viaShape = circular
        ? `<circle cx="${px(via.center.x)}" cy="${py(via.center.y)}" r="${(via.width * scale) / 2}" fill="#6366f1" stroke="#312e81"/>`
        : `<rect x="${px(via.center.x - via.width / 2)}" y="${py(via.center.y + via.height / 2)}" width="${via.width * scale}" height="${via.height * scale}" fill="#6366f1" stroke="#312e81"/>`
      return `<g><text x="${x}" y="85" font-size="22" font-weight="600">${title}</text>${padShapes}<circle cx="${px(foreignPad.center.x)}" cy="${py(foreignPad.center.y)}" r="${(foreignPad.width / 2 + input.minViaEdgeToPadEdgeClearance!) * scale}" fill="none" stroke="#0f766e" stroke-width="2" stroke-dasharray="6 4"/>${viaShape}<circle cx="${px(capturedVia.x)}" cy="${py(capturedVia.y)}" r="${(capturedVia.via_hole_diameter * scale) / 2}" fill="white" stroke="#312e81"/><text x="${x}" y="540" font-size="22" font-weight="600" fill="${color}">Gap to U1 R3: ${gap.toFixed(3)} mm</text></g>`
    })
    .join("")
  await expect(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="630" viewBox="0 0 1080 630"><rect width="1080" height="630" fill="white"/><g fill="#172554" font-family="Arial, sans-serif"><text x="35" y="32" font-size="25" font-weight="600">H616 DDR: fixed data via beside the U1 BGA</text><text x="35" y="56" font-size="16">Board crop x 1.00–2.33, y 15.00–16.45 mm · +X right, +Y up · top view</text>${panels}<text x="35" y="582" font-size="18">Captured barrel: copper Ø0.350 / drill Ø0.150 mm · top → inner1 → inner2 → bottom</text><text x="35" y="610" font-size="17">Dashed ring: U1 R3 copper + declared 0.100 mm clearance. Coordinates and data copper stay fixed.</text></g></svg>`,
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
