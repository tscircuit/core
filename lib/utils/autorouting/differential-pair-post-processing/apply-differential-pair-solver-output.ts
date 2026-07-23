import { su } from "@tscircuit/circuit-json-util"
import type { LayerRef, PcbTrace } from "circuit-json"
import type { Group } from "lib/components/primitive-components/Group"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { getViaDiameterDefaults } from "lib/utils/pcbStyle/getViaDiameterDefaults"
import type {
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "../SimpleRouteJson"
import {
  differentialPairSolverOutputChangesRoutes,
  getDifferentialPairConnectionNames,
  getSimplifiedPcbTraceConnectionName,
} from "./validate-differential-pair-solver-output"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

const normalizeSolverRoute = (
  route: SimplifiedPcbTrace["route"],
): PcbTrace["route"] =>
  route.map((routePoint) => {
    if (routePoint.route_type !== "through_obstacle") {
      return structuredClone(routePoint) as PcbTrace["route"][number]
    }
    return {
      route_type: "through_pad",
      start: structuredClone(routePoint.start),
      end: structuredClone(routePoint.end),
      start_layer: routePoint.from_layer as LayerRef,
      end_layer: routePoint.to_layer as LayerRef,
      width: routePoint.width,
    }
  })

export const applyDifferentialPairSolverOutput = ({
  group,
  inputSimpleRouteJson,
  outputSimpleRouteJson,
  differentialPairs,
}: {
  group: Group<any>
  inputSimpleRouteJson: SimpleRouteJson
  outputSimpleRouteJson: SimpleRouteJson
  differentialPairs: readonly SimpleRouteDifferentialPair[]
}): boolean => {
  if (
    !differentialPairSolverOutputChangesRoutes({
      inputSimpleRouteJson,
      outputSimpleRouteJson,
      differentialPairs,
    })
  ) {
    return false
  }

  const db = group.root!.db
  const differentialPairConnectionNames =
    getDifferentialPairConnectionNames(differentialPairs)
  const inputPairTraces = (inputSimpleRouteJson.traces ?? []).filter((trace) =>
    differentialPairConnectionNames.has(
      getSimplifiedPcbTraceConnectionName(trace),
    ),
  )
  const outputTracesById = new Map<PcbTraceId, SimplifiedPcbTrace>(
    (outputSimpleRouteJson.traces ?? []).map((trace) => [
      trace.pcb_trace_id,
      trace,
    ]),
  )
  const affectedPcbTraceIds = new Set(
    inputPairTraces.map((trace) => trace.pcb_trace_id),
  )
  const originalPcbTraces = inputPairTraces.map((inputTrace) => {
    const originalPcbTrace = db.pcb_trace.get(inputTrace.pcb_trace_id)
    if (!originalPcbTrace) {
      throw new Error(
        `Cannot replace missing pcb_trace "${inputTrace.pcb_trace_id}"`,
      )
    }
    return structuredClone(originalPcbTrace)
  })
  const replacementPcbTraces = originalPcbTraces.map((originalPcbTrace) => {
    const outputTrace = outputTracesById.get(originalPcbTrace.pcb_trace_id)
    if (!outputTrace) {
      throw new Error(
        `Cannot find solver output for pcb_trace "${originalPcbTrace.pcb_trace_id}"`,
      )
    }
    const normalizedRoute = normalizeSolverRoute(outputTrace.route)
    const sourceTraceId = getSourceTraceIdForRoutedTrace({
      db,
      trace: {
        ...originalPcbTrace,
        ...outputTrace,
        route: normalizedRoute,
      },
      subcircuit_id: group.subcircuit_id,
    })
    if (!sourceTraceId) {
      throw new Error(
        `Cannot resolve source trace mapping for differential-pair pcb_trace "${originalPcbTrace.pcb_trace_id}"`,
      )
    }
    return {
      ...originalPcbTrace,
      source_trace_id: sourceTraceId,
      route: normalizedRoute,
    } satisfies PcbTrace
  })

  const pcbStyle = group.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
  const board = db.pcb_board.list()[0]
  const routedViaHoleDiameter = board?.min_via_hole_diameter ?? holeDiameter
  const routedViaPadDiameter = board?.min_via_pad_diameter ?? padDiameter

  const candidateDb = su(structuredClone(db.toArray()))
  for (const candidatePcbVia of candidateDb.pcb_via.list()) {
    if (
      candidatePcbVia.pcb_trace_id &&
      affectedPcbTraceIds.has(candidatePcbVia.pcb_trace_id)
    ) {
      candidateDb.pcb_via.delete(candidatePcbVia.pcb_via_id)
    }
  }
  for (const replacementPcbTrace of replacementPcbTraces) {
    candidateDb.pcb_trace.update(
      replacementPcbTrace.pcb_trace_id,
      structuredClone(replacementPcbTrace),
    )
    const subcircuitConnectivityMapKey = replacementPcbTrace.source_trace_id
      ? candidateDb.source_trace.get(replacementPcbTrace.source_trace_id)
          ?.subcircuit_connectivity_map_key
      : undefined

    for (const routePoint of replacementPcbTrace.route) {
      if (routePoint.route_type !== "via") continue
      const routedViaPoint = routePoint as typeof routePoint & {
        via_diameter?: number
        via_hole_diameter?: number
      }
      candidateDb.pcb_via.insert({
        pcb_trace_id: replacementPcbTrace.pcb_trace_id,
        x: routePoint.x,
        y: routePoint.y,
        hole_diameter:
          routedViaPoint.via_hole_diameter ??
          routePoint.hole_diameter ??
          routedViaHoleDiameter,
        outer_diameter:
          routedViaPoint.via_diameter ??
          routePoint.outer_diameter ??
          routedViaPadDiameter,
        layers: getViaBoardLayers(group._getSubcircuitLayerCount()),
        from_layer: routePoint.from_layer,
        to_layer: routePoint.to_layer,
        subcircuit_id: group.subcircuit_id!,
        pcb_group_id: group.pcb_group_id ?? undefined,
        subcircuit_connectivity_map_key: subcircuitConnectivityMapKey,
      })
    }
  }

  group.root!.db = candidateDb

  return true
}
