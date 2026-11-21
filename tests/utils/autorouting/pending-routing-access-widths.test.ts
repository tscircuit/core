import { expect, test } from "bun:test"
import {
  getPendingRoutingAccessFromSrj,
  type PendingRoutingPhasePlan,
} from "lib/components/primitive-components/Group/get-pending-routing-access"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("future requests preserve width precedence after existing phase DRC overrides", () => {
  const active: PendingRoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [],
    nets: [{ source_net_id: "active" }],
  }
  const future: PendingRoutingPhasePlan = {
    routingPhaseIndex: 1,
    traces: [],
    nets: ["nominal_before_legacy", "explicit_bus_width", "implicit_width"].map(
      (source_net_id) => ({ source_net_id }),
    ),
  }
  const futureDrc: PendingRoutingPhasePlan = {
    routingPhaseIndex: 2,
    traces: [],
    nets: ["phase_minimum", "phase_default"].map((source_net_id) => ({
      source_net_id,
    })),
    drcTolerances: { minTraceWidth: 0.2 },
  }
  const sourceSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    nominalTraceWidth: 0.15,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [
      { name: "active", pointsToConnect: [] },
      {
        name: "nominal_before_legacy",
        nominalTraceWidth: 0.12,
        width: 0.9,
        pointsToConnect: [],
      },
      {
        name: "explicit_bus_width",
        nominalTraceWidth: 0.4,
        width: 0.8,
        pointsToConnect: [],
      },
      { name: "implicit_width", pointsToConnect: [] },
      {
        name: "phase_minimum",
        nominalTraceWidth: 0.12,
        width: 0.9,
        pointsToConnect: [],
      },
      { name: "phase_default", pointsToConnect: [] },
    ],
    buses: [
      {
        busId: "first_override",
        connectionNames: ["explicit_bus_width"],
        traceWidth: 0.2,
      },
      {
        busId: "later_membership",
        connectionNames: ["explicit_bus_width"],
        traceWidth: 0.7,
      },
    ],
  }
  const originalSrj = JSON.stringify(sourceSrj)
  const routingPhasePlans = [active, future, futureDrc]
  const autorouterConfigByPhasePlan = new Map<
    PendingRoutingPhasePlan,
    NormalizedAutorouterConfig
  >(routingPhasePlans.map((phasePlan) => [phasePlan, { local: true }]))
  const access = getPendingRoutingAccessFromSrj(sourceSrj, {
    phasePlan: active,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  })!

  // Consumers retain the original nominal/legacy precedence; the transport
  // must not replace a nominal width with the larger deprecated alias.
  expect(access[0]!.connections[0]).toEqual(sourceSrj.connections[1])
  expect(access[0]!.connections[0]!.nominalTraceWidth).toBe(0.12)
  expect(access[0]!.connections[0]!.width).toBe(0.9)
  // The explicit narrower first bus and its ordering survive unchanged.
  // The producer must not aggregate all owning bus widths into a maximum.
  expect(access[0]!.connections[1]).toEqual(sourceSrj.connections[2])
  expect(access[0]!.buses).toEqual(sourceSrj.buses)
  expect(access[0]!.buses?.map((bus) => bus.traceWidth)).toEqual([0.2, 0.7])
  expect(access[0]!.connections[2]).not.toHaveProperty("nominalTraceWidth")
  expect(access[0]!.connections[2]).not.toHaveProperty("width")
  // Only the existing future phase DRC transformation supplies these fields.
  expect(access[1]!.connections[0]).toEqual({
    ...sourceSrj.connections[4],
    nominalTraceWidth: 0.2,
  })
  expect(access[1]!.connections[1]).toEqual({
    ...sourceSrj.connections[5],
    nominalTraceWidth: 0.2,
    width: 0.2,
  })
  expect(JSON.stringify(sourceSrj)).toBe(originalSrj)
})
