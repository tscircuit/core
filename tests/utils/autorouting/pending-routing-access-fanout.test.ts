import { expect, test } from "bun:test"
import {
  getPendingRoutingAccessFromSrj,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/get-pending-routing-access"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("future fanouts retain physical SRJ bounds and actual escape layers", () => {
  const active: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [],
    nets: [{ source_net_id: "active" }],
  }
  const fanout: PendingRoutingPhasePlan &
    Pick<RoutingPhasePlan, "fanoutBounds"> = {
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
    outline: [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ],
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
  const access = getPendingRoutingAccessFromSrj(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  // A narrow fanout exit boundary does not clip the physical access area.
  expect(access?.[0]?.bounds).toEqual(sourceSrj.bounds)
  expect(access?.[0]?.outline).toEqual(sourceSrj.outline)
  expect(access?.[0]?.allowedLayers).toEqual(["inner2"])
  expect(access?.[0]?.buses?.[0]?.allowedLayers).toEqual(["inner2"])
  autorouterConfigByPhasePlan.set(fanout, {
    local: true,
    preset: "single_layer_fanout",
  })
  expect(
    getPendingRoutingAccessFromSrj(sourceSrj, {
      phasePlan: active,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    })?.[0]?.allowedLayers,
  ).toEqual(["top"])
  // Access metadata requires no eagerly constructed future fanout solver. Its
  // authored exit boundary may be absent or extend beyond the physical SRJ.
  for (const fanoutBounds of [
    undefined,
    { minX: 9, maxX: 15, minY: -1, maxY: 1 },
  ]) {
    fanout.fanoutBounds = fanoutBounds
    const futureAccess = getPendingRoutingAccessFromSrj(sourceSrj, {
      phasePlan: active,
      routingPhasePlans,
      autorouterConfigByPhasePlan,
    })
    expect(futureAccess?.[0]?.bounds).toEqual(sourceSrj.bounds)
    expect(futureAccess?.[0]?.outline).toEqual(sourceSrj.outline)
  }
  autorouterConfigByPhasePlan.set(fanout, {
    local: true,
    preset: "fanout",
    algorithmFn: () => {
      throw new Error("A metadata-only test must not call a custom router")
    },
  })
  const customAccess = getPendingRoutingAccessFromSrj(sourceSrj, {
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
