import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { FanoutBoundaryResult } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteBounds } from "lib/utils/autorouting/SimpleRouteJson"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"

const boundsDiffer = (
  first: SimpleRouteBounds,
  second: SimpleRouteBounds,
): boolean =>
  Math.abs(first.minX - second.minX) > 1e-6 ||
  Math.abs(first.maxX - second.maxX) > 1e-6 ||
  Math.abs(first.minY - second.minY) > 1e-6 ||
  Math.abs(first.maxY - second.maxY) > 1e-6

export const Group_applyResolvedFanoutBoundary = ({
  db,
  routingPhasePlan,
  fanoutBoundaryResult,
}: {
  db: CircuitJsonUtilObjects
  routingPhasePlan: RoutingPhasePlan
  fanoutBoundaryResult: FanoutBoundaryResult | undefined
}): void => {
  const routingPcbGroupId = routingPhasePlan.routingPcbGroupId
  const resolvedBoundary = fanoutBoundaryResult?.resolvedBoundary
  if (!routingPcbGroupId || !resolvedBoundary) return

  const previousBoundary = routingPhasePlan.routingBounds
  const ignoredProperty = routingPhasePlan.ignoredFanoutBoundaryProperty
  const conflictingBoundary =
    ignoredProperty === "fanoutBoundaryPadding"
      ? fanoutBoundaryResult.fanoutPaddingBoundary
      : (routingPhasePlan.breakoutPaddingBoundary ?? resolvedBoundary)

  if (
    ignoredProperty &&
    previousBoundary &&
    conflictingBoundary &&
    boundsDiffer(previousBoundary, conflictingBoundary)
  ) {
    const pcbGroup = db.pcb_group.get(routingPcbGroupId)
    const sourceComponentId = db.pcb_component
      .list()
      .find(
        (component) => component.pcb_group_id === routingPcbGroupId,
      )?.source_component_id
    const message =
      ignoredProperty === "fanoutBoundaryPadding"
        ? `${pcbGroup?.name ?? "Breakout"} defines conflicting breakout and fanout boundaries. Explicit breakout geometry takes precedence, so fanoutBoundaryPadding is ignored.`
        : `${pcbGroup?.name ?? "Breakout"} defines conflicting breakout and fanout boundaries. fanoutBoundaryPadding takes precedence, so generic breakout padding is ignored.`
    const warningAlreadyExists = db.source_property_ignored_warning
      .list()
      .some(
        (warning) =>
          warning.source_component_id === sourceComponentId &&
          warning.property_name === ignoredProperty &&
          warning.message === message,
      )
    if (sourceComponentId && !warningAlreadyExists) {
      db.source_property_ignored_warning.insert({
        source_component_id: sourceComponentId,
        property_name: ignoredProperty,
        message,
        error_type: "source_property_ignored_warning",
        subcircuit_id: pcbGroup?.subcircuit_id,
      })
    }
  }

  db.pcb_group.update(routingPcbGroupId, {
    center: {
      x: (resolvedBoundary.minX + resolvedBoundary.maxX) / 2,
      y: (resolvedBoundary.minY + resolvedBoundary.maxY) / 2,
    },
    width: resolvedBoundary.maxX - resolvedBoundary.minX,
    height: resolvedBoundary.maxY - resolvedBoundary.minY,
  })
}
