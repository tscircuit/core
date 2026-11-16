import { expect, test } from "bun:test"
import {
  getPendingRoutingAccessFromSrj,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/get-pending-routing-access"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("future dogbone access preserves phase layers without fanout bus overrides", () => {
  const active: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [],
    nets: [{ source_net_id: "active" }],
  }
  const dogbone: PendingRoutingPhasePlan = {
    routingPhaseIndex: 1,
    fanoutRoutingLayers: ["inner2"],
    traces: [],
    nets: [{ source_net_id: "dogbone" }],
  }
  const sourceSrj: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [],
    connections: [
      { name: "active", pointsToConnect: [] },
      { name: "dogbone", pointsToConnect: [] },
    ],
    buses: [
      {
        busId: "dogbone_bus",
        connectionNames: ["dogbone"],
        allowedLayers: ["inner1", "inner2"],
        preferredLayer: "inner1",
      },
    ],
  }
  const originalSrj = structuredClone(sourceSrj)
  const routingPhasePlans = [active, dogbone]
  const autorouterConfigByPhasePlan = new Map<
    PendingRoutingPhasePlan,
    NormalizedAutorouterConfig
  >([
    [active, { local: true }],
    [dogbone, { local: true, preset: "dogbone" }],
  ])
  const getFutureAccess = () =>
    getPendingRoutingAccessFromSrj(sourceSrj, {
      phasePlan: active,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    })
  const access = getFutureAccess()
  expect(access?.[0]?.allowedLayers).toEqual(["inner2"])
  // Dogbone receives the authored bus policy, not fanout's preferred-layer rule.
  expect(access?.[0]?.buses?.[0]?.allowedLayers).toEqual(["inner1", "inner2"])
  expect(sourceSrj).toEqual(originalSrj)
  expect(dogbone.fanoutRoutingLayers).toEqual(["inner2"])

  autorouterConfigByPhasePlan.set(dogbone, {
    local: true,
    preset: "dogbone",
    algorithmFn: () => {
      throw new Error(
        "Future routing metadata must not construct a custom router",
      )
    },
  })
  expect(getFutureAccess()?.[0]?.allowedLayers).toBeUndefined()
  const unrestrictedDogbone = { ...dogbone, fanoutRoutingLayers: undefined }
  autorouterConfigByPhasePlan.set(unrestrictedDogbone, {
    local: true,
    preset: "dogbone",
  })
  expect(
    getPendingRoutingAccessFromSrj(sourceSrj, {
      phasePlan: active,
      routingPhasePlans: [active, unrestrictedDogbone],
      autorouterConfigByPhasePlan,
    })?.[0]?.allowedLayers,
  ).toBeUndefined()
})
