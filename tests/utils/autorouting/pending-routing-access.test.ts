import { expect, test } from "bun:test"
import "graphics-debug/matcher"
import type { GraphicsObject } from "graphics-debug"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Group_getPendingRoutingAccess } from "lib/components/primitive-components/Group/Group_getPendingRoutingAccess"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type {
  PcbGroupId,
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

const createConnection = ({
  name,
  routingPcbGroupId,
  y,
}: {
  name: string
  routingPcbGroupId: PcbGroupId
  y: number
}): SimpleRouteConnection => ({
  name,
  routingPcbGroupId,
  nominalTraceWidth: 0.12,
  pointsToConnect: [
    { x: -4, y, layer: "top", pointId: `${name}_cpu` },
    { x: 4, y, layer: "top", pointId: `${name}_ram` },
  ],
})

/** Board-world mm, +X right and +Y up. Dashed lines are requests, not copper. */
const getPendingRoutingAccessGraphics = ({
  sourceSrj,
  phaseInput,
}: {
  sourceSrj: SimpleRouteJson
  phaseInput: SimpleRouteJson
}): GraphicsObject => {
  const activeConnections = new Set(
    phaseInput.connections.map((connection) => connection.name),
  )
  const pendingConnections = new Set(
    phaseInput.pendingRoutingAccess?.flatMap((access) =>
      access.connections.map((connection) => connection.name),
    ),
  )
  const colorByConnection = new Map(
    sourceSrj.connections.map((connection) => [
      connection.name,
      activeConnections.has(connection.name)
        ? "#b23a24"
        : pendingConnections.has(connection.name)
          ? "#087c91"
          : "#b1b7bf",
    ]),
  )
  return {
    coordinateSystem: "cartesian",
    rects: sourceSrj.obstacles.map((obstacle) => ({
      center: obstacle.center,
      width: obstacle.width,
      height: obstacle.height,
      fill: "#e2e5e9",
      stroke: "#616975",
    })),
    lines: sourceSrj.connections.map((connection) => ({
      points: connection.pointsToConnect,
      strokeColor: colorByConnection.get(connection.name),
      strokeWidth: 0.06,
      strokeDash: [0.15, 0.15],
    })),
    circles: sourceSrj.connections.flatMap((connection) =>
      connection.pointsToConnect.map((point) => ({
        center: point,
        radius: 0.16,
        fill: colorByConnection.get(connection.name),
      })),
    ),
    texts: [
      {
        x: -5,
        y: 5.2,
        text: "Phase 1: preserve future terminal access",
        fontSize: 0.45,
      },
      {
        x: -5,
        y: 4.5,
        text: `Active: ${activeConnections.size}; pending: ${pendingConnections.size}`,
        fontSize: 0.35,
      },
      {
        x: -5,
        y: 3.9,
        text: "Red: current request; teal: future request; grey: excluded",
        fontSize: 0.3,
      },
      ...sourceSrj.connections.map((connection) => ({
        x: 4.5,
        y: connection.pointsToConnect[0]!.y,
        text: connection.name,
        color: colorByConnection.get(connection.name),
        fontSize: 0.3,
      })),
      {
        x: -5,
        y: -4.2,
        text: "Spare pad has no routing request: excluded",
        fontSize: 0.3,
      },
      {
        x: -5,
        y: -4.8,
        text: "Future BYTE1: 0.30 mm wire; inner1/inner2; 0.24 mm pad clearance",
        fontSize: 0.3,
      },
      {
        x: -5,
        y: -5.4,
        text: "Dashed lines show native routing intent, not solved traces",
        fontSize: 0.3,
      },
    ].map((text) => ({ ...text, anchorSide: "center_left" })),
  }
}

test("phase requests retain only later routing intent with its own physical rules", async () => {
  const prior: RoutingPhasePlan = {
    routingPhaseIndex: 30,
    routingPcbGroupId: "prior",
    traces: [],
    nets: [],
  }
  const active: RoutingPhasePlan = {
    routingPhaseIndex: 1,
    routingPcbGroupId: "active",
    routingBounds: { minX: -5, maxX: 5, minY: -1, maxY: 1 },
    drcTolerances: { minTraceWidth: 0.7, minTraceToPadEdgeClearance: 0.8 },
    traces: [],
    nets: [],
  }
  const byte1: RoutingPhasePlan = {
    routingPhaseIndex: 0,
    routingPcbGroupId: "byte1",
    drcTolerances: {
      minTraceWidth: 0.22,
      minTraceToPadEdgeClearance: 0.24,
      minTraceToHoleEdgeClearance: 0.26,
      minViaEdgeToPadEdgeClearance: 0.28,
      minViaHoleDiameter: 0.4,
      minViaPadDiameter: 0.8,
      minViaHoleEdgeToViaHoleEdgeClearance: 0.32,
      minPlatedHoleDrillEdgeToDrillEdgeClearance: 0.34,
      minPadEdgeToPadEdgeClearance: 0.36,
      minBoardEdgeClearance: 0.38,
    },
    traces: [],
    nets: [],
  }
  const remaining: RoutingPhasePlan = {
    routingPhaseIndex: null,
    routingPcbGroupId: "remaining",
    isImplicitRemainingPhase: true,
    traces: [],
    nets: [],
  }
  const priorAgain: RoutingPhasePlan = { ...prior, routingPhaseIndex: 5 }
  const reroute: RoutingPhasePlan = {
    routingPhaseIndex: 6,
    routingPcbGroupId: "reroute",
    reroute: true,
    traces: [],
    nets: [],
  }
  const testPoints: RoutingPhasePlan = {
    routingPhaseIndex: 7,
    routingPcbGroupId: "test_points",
    testPointOptions: { layer: "bottom", diameter: 1 },
    traces: [],
    nets: [],
  }
  const connections = [
    createConnection({ name: "PRIOR", routingPcbGroupId: "prior", y: 2.5 }),
    createConnection({ name: "BYTE0", routingPcbGroupId: "active", y: 1.5 }),
    createConnection({ name: "BYTE1", routingPcbGroupId: "byte1", y: 0.5 }),
    createConnection({
      name: "ADDRESS",
      routingPcbGroupId: "remaining",
      y: -0.5,
    }),
    createConnection({
      name: "REROUTE_ONLY",
      routingPcbGroupId: "reroute",
      y: -1.5,
    }),
    createConnection({
      name: "TEST_POINTS_ONLY",
      routingPcbGroupId: "test_points",
      y: -2.5,
    }),
  ]
  const sourceSrj: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    minViaDiameter: 0.6,
    min_via_hole_diameter: 0.3,
    minTraceToPadEdgeClearance: 0.14,
    allowViaInPad: true,
    allowBlindAndBuriedVias: false,
    bounds: { minX: -6, maxX: 6, minY: -4, maxY: 4 },
    connections,
    obstacles: [
      ...connections.flatMap((connection) =>
        connection.pointsToConnect.map((point) => ({
          type: "rect" as const,
          center: { x: point.x, y: point.y },
          width: 0.4,
          height: 0.4,
          layers: [point.layer],
          connectedTo: [connection.name],
        })),
      ),
      {
        type: "rect",
        center: { x: -4, y: -3.5 },
        width: 0.4,
        height: 0.4,
        layers: ["top"],
        connectedTo: [],
      },
    ],
    buses: [
      {
        busId: "BYTE1",
        connectionNames: ["BYTE1"],
        traceWidth: 0.3,
        allowedLayers: ["inner1", "inner2"],
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "prior_copper",
        connection_name: "PRIOR",
        route: connections[0]!.pointsToConnect.map((point) => ({
          route_type: "wire",
          ...point,
          width: 0.12,
        })),
      },
    ],
  }
  const originalSrj = JSON.stringify(sourceSrj)
  const routingPhasePlans = [
    prior,
    active,
    byte1,
    remaining,
    priorAgain,
    reroute,
    testPoints,
  ]
  const autorouterConfigByPhasePlan = new Map<
    RoutingPhasePlan,
    NormalizedAutorouterConfig
  >(
    routingPhasePlans.map((phasePlan) => [
      phasePlan,
      { local: true, allowViaInPad: phasePlan !== byte1 },
    ]),
  )
  const pendingRoutingAccess = Group_getPendingRoutingAccess(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(
    pendingRoutingAccess?.map((access) =>
      access.connections.map((connection) => connection.name),
    ),
  ).toEqual([["BYTE1"], ["ADDRESS"]])
  const [byteAccess, remainingAccess] = pendingRoutingAccess!
  expect(byteAccess!.connections[0]!.nominalTraceWidth).toBe(0.22)
  expect(byteAccess!.buses?.[0]?.traceWidth).toBe(0.3)
  expect(byteAccess!.buses?.[0]?.allowedLayers).toEqual(["inner1", "inner2"])
  expect(byteAccess!.bounds).toEqual(sourceSrj.bounds)
  expect(byteAccess!.minTraceToPadEdgeClearance).toBe(0.24)
  expect(byteAccess!.minTraceToHoleEdgeClearance).toBe(0.26)
  expect(byteAccess!.minViaEdgeToPadEdgeClearance).toBe(0.28)
  expect(byteAccess!.minViaHoleDiameter).toBe(0.4)
  expect(byteAccess!.minViaPadDiameter).toBe(0.8)
  expect(byteAccess!.minViaHoleEdgeToViaHoleEdgeClearance).toBe(0.32)
  expect(byteAccess!.minPlatedHoleDrillEdgeToDrillEdgeClearance).toBe(0.34)
  expect(byteAccess!.minPadEdgeToPadEdgeClearance).toBe(0.36)
  expect(byteAccess!.minBoardEdgeClearance).toBe(0.38)
  expect(byteAccess!.allowViaInPad).toBe(false)
  expect(remainingAccess!.minViaPadDiameter).toBe(0.6)
  expect(remainingAccess!.minViaHoleDiameter).toBe(0.3)
  for (const access of pendingRoutingAccess!) {
    expect(access).not.toHaveProperty("obstacles")
    expect(access).not.toHaveProperty("traces")
    expect(access).not.toHaveProperty("pendingRoutingAccess")
  }
  expect(
    Group_getPendingRoutingAccess(sourceSrj, {
      phasePlan: remaining,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    }),
  ).toBeUndefined()
  expect(
    Group_getPendingRoutingAccess(sourceSrj, {
      phasePlan: active,
      routingPhasePlans: [prior, active],
      autorouterConfigByPhasePlan,
    }),
  ).toBeUndefined()
  expect(JSON.stringify(sourceSrj)).toBe(originalSrj)
  const phaseInput = Group_filterSimpleRouteJsonForPhase(sourceSrj, active)
  phaseInput.pendingRoutingAccess = pendingRoutingAccess
  await expect(
    getPendingRoutingAccessGraphics({ sourceSrj, phaseInput }),
  ).toMatchGraphicsSvg(import.meta.path, { backgroundColor: "white" })
})
