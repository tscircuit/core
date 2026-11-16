import type {
  PendingRoutingAccess,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { NormalizedAutorouterConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { RoutingPhasePreparationError } from "lib/utils/autorouting/routing-phase-preparation-error"
import { getFanoutBusAllowedLayers } from "lib/utils/autorouting/get-fanout-bus-allowed-layers"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"
import {
  connectionIsInRoutingPhase,
  Group_applyDrcTolerancesToSimpleRouteJson,
  Group_selectSimpleRouteJsonForPhase,
  type RoutingPhaseSrjTargets,
} from "./Group_phasedAutoroutingUtils"

export type PendingRoutingPhasePlan = RoutingPhaseSrjTargets &
  Pick<
    RoutingPhasePlan,
    | "routingPhaseIndex"
    | "drcTolerances"
    | "reroute"
    | "testPointOptions"
    | "fanoutRoutingLayers"
  >

/** Replace inherited intent on a derived SRJ; empty future work has no field. */
export function Group_withPendingRoutingAccess(
  simpleRouteJson: SimpleRouteJson,
  pendingRoutingAccess: PendingRoutingAccess[] | undefined,
): SimpleRouteJson {
  const phaseSimpleRouteJson = { ...simpleRouteJson }
  delete phaseSimpleRouteJson.pendingRoutingAccess
  if (pendingRoutingAccess?.length) {
    phaseSimpleRouteJson.pendingRoutingAccess = pendingRoutingAccess
  }
  return phaseSimpleRouteJson
}

/**
 * Retain future routing intent without copying obstacles or completed copper.
 * All geometry remains in board-world mm (+X right, +Y up), as positions.
 * Plan order includes implicit fanouts and remaining routing, not just indices.
 * The selected SRJ bounds describe physical terminal access. Fanout exit targets
 * are not routing-area limits and future fanout completion is not established here.
 */
export function Group_getPendingRoutingAccess<
  PhasePlan extends PendingRoutingPhasePlan,
>(
  simpleRouteJson: SimpleRouteJson,
  {
    phasePlan,
    routingPhasePlans,
    autorouterConfigByPhasePlan,
  }: {
    phasePlan: PhasePlan
    routingPhasePlans: readonly PhasePlan[]
    autorouterConfigByPhasePlan: ReadonlyMap<
      PhasePlan,
      NormalizedAutorouterConfig
    >
  },
): PendingRoutingAccess[] | undefined {
  const phaseOrdinal = routingPhasePlans.indexOf(phasePlan)
  const startedPhasePlans = routingPhasePlans.slice(0, phaseOrdinal + 1)
  const pendingRoutingAccess: PendingRoutingAccess[] = []

  for (const futurePhasePlan of routingPhasePlans.slice(phaseOrdinal + 1)) {
    // Rerouting and test-point insertion revisit already requested copper.
    if (futurePhasePlan.reroute || futurePhasePlan.testPointOptions) continue
    const futureSimpleRouteJson = Group_applyDrcTolerancesToSimpleRouteJson(
      Group_selectSimpleRouteJsonForPhase(simpleRouteJson, futurePhasePlan),
      futurePhasePlan.drcTolerances,
    )
    const connections = futureSimpleRouteJson.connections.filter(
      (connection) =>
        connection.routingPcbGroupId === futurePhasePlan.routingPcbGroupId &&
        !startedPhasePlans.some(
          (startedPhasePlan) =>
            connection.routingPcbGroupId ===
              startedPhasePlan.routingPcbGroupId &&
            connectionIsInRoutingPhase(connection, startedPhasePlan),
        ),
    )
    if (connections.length === 0) continue

    const futureAutorouterConfig =
      autorouterConfigByPhasePlan.get(futurePhasePlan)
    if (!futureAutorouterConfig) {
      throw new RoutingPhasePreparationError(
        "Future routing configuration must be resolved before preserving terminal access",
      )
    }
    const fanoutMode = futureAutorouterConfig.algorithmFn
      ? undefined
      : futureAutorouterConfig.preset
    const isFanout =
      fanoutMode === "fanout" || fanoutMode === "single_layer_fanout"

    const connectionNames = new Set(
      connections.map((connection) => connection.name),
    )
    const buses = futureSimpleRouteJson.buses
      ?.map((bus) => ({
        ...bus,
        ...(isFanout ? { allowedLayers: getFanoutBusAllowedLayers(bus) } : {}),
        connectionNames: bus.connectionNames.filter((connectionName) =>
          connectionNames.has(connectionName),
        ),
        ...(bus.connectionExitTargets
          ? {
              connectionExitTargets: Object.fromEntries(
                Object.entries(bus.connectionExitTargets).filter(
                  ([connectionName]) => connectionNames.has(connectionName),
                ),
              ),
            }
          : {}),
      }))
      .filter((bus) => bus.connectionNames.length > 0)

    pendingRoutingAccess.push({
      connections,
      buses: buses?.length ? buses : undefined,
      bounds: futureSimpleRouteJson.bounds,
      outline: futureSimpleRouteJson.outline,
      allowedLayers: isFanout
        ? fanoutMode === "single_layer_fanout"
          ? ["top"]
          : futurePhasePlan.fanoutRoutingLayers
        : undefined,
      minTraceWidth: futureSimpleRouteJson.minTraceWidth,
      defaultObstacleMargin: futureSimpleRouteJson.defaultObstacleMargin,
      minTraceToPadEdgeClearance:
        futureSimpleRouteJson.minTraceToPadEdgeClearance,
      minTraceToHoleEdgeClearance:
        futureSimpleRouteJson.minTraceToHoleEdgeClearance,
      minViaEdgeToPadEdgeClearance:
        futureSimpleRouteJson.minViaEdgeToPadEdgeClearance,
      minViaPadDiameter:
        futureSimpleRouteJson.minViaPadDiameter ??
        futureSimpleRouteJson.min_via_pad_diameter ??
        futureSimpleRouteJson.minViaDiameter,
      minViaHoleDiameter:
        futureSimpleRouteJson.minViaHoleDiameter ??
        futureSimpleRouteJson.min_via_hole_diameter,
      minViaHoleEdgeToViaHoleEdgeClearance:
        futureSimpleRouteJson.minViaHoleEdgeToViaHoleEdgeClearance,
      minPlatedHoleDrillEdgeToDrillEdgeClearance:
        futureSimpleRouteJson.minPlatedHoleDrillEdgeToDrillEdgeClearance,
      minPadEdgeToPadEdgeClearance:
        futureSimpleRouteJson.minPadEdgeToPadEdgeClearance,
      minBoardEdgeClearance: futureSimpleRouteJson.minBoardEdgeClearance,
      allowViaInPad:
        futureAutorouterConfig.allowViaInPad ??
        futureSimpleRouteJson.allowViaInPad,
      allowBlindAndBuriedVias: futureSimpleRouteJson.allowBlindAndBuriedVias,
    })
  }

  return pendingRoutingAccess.length ? pendingRoutingAccess : undefined
}
