import { expect, test } from "bun:test"
import {
  getPendingRoutingAccessFromSrj,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/get-pending-routing-access"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("local fanouts do not erase a later global bridge with the same source owner", () => {
  const prior: PendingRoutingPhasePlan = {
    routingPhaseIndex: null,
    routingPcbGroupId: "cpu_fanout",
    traces: [{ source_trace_id: "source_trace_ddr" }],
    nets: [],
  }
  const active: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [{ source_trace_id: "source_trace_byte0" }],
    nets: [],
  }
  const ram: PendingRoutingPhasePlan = {
    routingPhaseIndex: null,
    routingPcbGroupId: "ram_fanout",
    traces: [{ source_trace_id: "source_trace_ddr" }],
    nets: [],
  }
  const remaining: PendingRoutingPhasePlan = {
    routingPhaseIndex: null,
    traces: [{ source_trace_id: "source_trace_ddr" }],
    nets: [],
  }
  const sourceSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [],
    connections: [
      {
        name: "cpu_escape",
        routingPcbGroupId: "cpu_fanout",
        source_trace_id: "source_trace_ddr",
        pointsToConnect: [],
      },
      {
        name: "byte0",
        source_trace_id: "source_trace_byte0",
        pointsToConnect: [],
      },
      {
        name: "ram_escape",
        routingPcbGroupId: "ram_fanout",
        source_trace_id: "source_trace_ddr",
        pointsToConnect: [],
      },
      {
        name: "global_bridge",
        source_trace_id: "source_trace_ddr",
        pointsToConnect: [],
      },
    ],
  }
  const routingPhasePlans = [prior, active, ram, remaining]
  const autorouterConfigByPhasePlan = new Map<
    PendingRoutingPhasePlan,
    NormalizedAutorouterConfig
  >(routingPhasePlans.map((phasePlan) => [phasePlan, { local: true }]))
  const accessBeforeRam = getPendingRoutingAccessFromSrj(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(
    accessBeforeRam?.map((access) =>
      access.connections.map((connection) => connection.name),
    ),
  ).toEqual([["ram_escape"], ["global_bridge"]])
  const accessAfterRam = getPendingRoutingAccessFromSrj(sourceSrj, {
    phasePlan: ram,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })
  expect(
    accessAfterRam?.map((access) =>
      access.connections.map((connection) => connection.name),
    ),
  ).toEqual([["global_bridge"]])
})
