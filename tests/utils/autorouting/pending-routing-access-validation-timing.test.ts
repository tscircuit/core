import { expect, test } from "bun:test"
import {
  Group_getPendingRoutingAccess,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/Group_getPendingRoutingAccess"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("future physical intent does not enter later matching validation early", () => {
  const earlier: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [],
    nets: [{ source_net_id: "earlier" }],
  }
  const later0: PendingRoutingPhasePlan = {
    routingPhaseIndex: 1,
    traces: [],
    nets: [{ source_net_id: "DATA0" }],
    drcTolerances: { minTraceToPadEdgeClearance: 0.16 },
  }
  const later1: PendingRoutingPhasePlan = {
    routingPhaseIndex: 2,
    traces: [],
    nets: [{ source_net_id: "DATA1" }],
  }
  const sourceSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [
      {
        name: "earlier",
        pointsToConnect: [
          { x: -2, y: 0, layer: "top" },
          { x: 2, y: 0, layer: "top" },
        ],
      },
      {
        name: "DATA0",
        nominalTraceWidth: 0.12,
        pointsToConnect: [
          { x: -2, y: 1, layer: "top" },
          { x: 2, y: 1, layer: "top" },
        ],
      },
      {
        name: "DATA1",
        nominalTraceWidth: 0.12,
        pointsToConnect: [
          { x: -2, y: 2, layer: "top" },
          { x: 2, y: 2, layer: "top" },
        ],
      },
    ],
    buses: [
      {
        busId: "DATA",
        name: "DATA",
        connectionNames: ["DATA0", "DATA1"],
        traceWidth: 0.12,
        allowedLayers: ["top", "bottom"],
        maxLengthSkew: 0.05,
      },
    ],
  }
  const originalSrj = JSON.stringify(sourceSrj)
  const routingPhasePlans = [earlier, later0, later1]
  const autorouterConfigByPhasePlan = new Map<
    PendingRoutingPhasePlan,
    NormalizedAutorouterConfig
  >(routingPhasePlans.map((phasePlan) => [phasePlan, { local: true }]))
  const access = Group_getPendingRoutingAccess(sourceSrj, {
    phasePlan: earlier,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(
    access?.map((phaseAccess) =>
      phaseAccess.connections.map((connection) => connection.name),
    ),
  ).toEqual([["DATA0"], ["DATA1"]])
  expect(access?.[0]?.buses?.[0]).toEqual({
    ...sourceSrj.buses![0]!,
    connectionNames: ["DATA0"],
  })
  expect(access?.[0]?.minTraceToPadEdgeClearance).toBe(0.16)
  expect(
    Group_filterSimpleRouteJsonForPhase(sourceSrj, earlier).connections.map(
      (connection) => connection.name,
    ),
  ).toEqual(["earlier"])
  expect(() => Group_filterSimpleRouteJsonForPhase(sourceSrj, later0)).toThrow(
    'Length-matched bus "DATA" cannot be split across autorouting phases',
  )
  expect(() => Group_filterSimpleRouteJsonForPhase(sourceSrj, later1)).toThrow(
    'Length-matched bus "DATA" cannot be split across autorouting phases',
  )

  const sourceWithPair: SimpleRouteJson = {
    ...sourceSrj,
    buses: undefined,
    differentialPairs: [
      { connectionNames: ["DATA0", "DATA1"], lengthTolerance: 0.05 },
    ],
  }
  expect(
    Group_getPendingRoutingAccess(sourceWithPair, {
      phasePlan: earlier,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    })?.map((phaseAccess) =>
      phaseAccess.connections.map((connection) => connection.name),
    ),
  ).toEqual([["DATA0"], ["DATA1"]])
  expect(() =>
    Group_filterSimpleRouteJsonForPhase(sourceWithPair, later0),
  ).toThrow(
    'Differential pair "DATA0/DATA1" cannot be split across autorouting phases',
  )
  expect(JSON.stringify(sourceSrj)).toBe(originalSrj)
})
