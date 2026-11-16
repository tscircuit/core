import { expect, test } from "bun:test"
import {
  Group_getPendingRoutingAccess,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/Group_getPendingRoutingAccess"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("future fanouts retain resolved boundary and actual escape layers", () => {
  const active: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [],
    nets: [{ source_net_id: "active" }],
  }
  const fanout: PendingRoutingPhasePlan = {
    routingPhaseIndex: 1,
    fanoutBounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
    fanoutRoutingLayers: ["inner2"],
    traces: [],
    nets: [{ source_net_id: "fanout" }],
  }
  const sourceSrj: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [],
    connections: [
      { name: "active", pointsToConnect: [] },
      { name: "fanout", pointsToConnect: [] },
    ],
    buses: [
      {
        busId: "fanout_bus",
        connectionNames: ["fanout"],
        allowedLayers: ["inner1", "inner2"],
        preferredLayer: "inner2",
      },
    ],
  }
  const routingPhasePlans = [active, fanout]
  const autorouterConfigByPhasePlan = new Map<
    PendingRoutingPhasePlan,
    NormalizedAutorouterConfig
  >([
    [active, { local: true }],
    [fanout, { local: true, preset: "fanout" }],
  ])
  const access = Group_getPendingRoutingAccess(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(access?.[0]?.bounds).toEqual(fanout.fanoutBounds)
  expect(access?.[0]?.allowedLayers).toEqual(["inner2"])
  expect(access?.[0]?.buses?.[0]?.allowedLayers).toEqual(["inner2"])
  autorouterConfigByPhasePlan.set(fanout, {
    local: true,
    preset: "single_layer_fanout",
  })
  expect(
    Group_getPendingRoutingAccess(sourceSrj, {
      phasePlan: active,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    })?.[0]?.allowedLayers,
  ).toEqual(["top"])
  fanout.fanoutBounds = undefined
  expect(() =>
    Group_getPendingRoutingAccess(sourceSrj, {
      phasePlan: active,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    }),
  ).toThrow("Future fanout routing bounds must be resolved")
  autorouterConfigByPhasePlan.set(fanout, {
    local: true,
    preset: "fanout",
    algorithmFn: () => {
      throw new Error("A metadata-only test must not call a custom router")
    },
  })
  const customAccess = Group_getPendingRoutingAccess(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(customAccess?.[0]?.bounds).toEqual(sourceSrj.bounds)
  expect(customAccess?.[0]?.allowedLayers).toBeUndefined()
  expect(customAccess?.[0]?.buses?.[0]?.allowedLayers).toEqual([
    "inner1",
    "inner2",
  ])
})
