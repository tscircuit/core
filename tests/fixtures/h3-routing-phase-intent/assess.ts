import {
  checkSourceTracesHavePcbTraces,
  checkEachPcbPortConnectedToPcbTraces,
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
  checkViaPadClearance,
  checkDifferentNetViaSpacing,
  checkTracesAreContiguous,
  checkViasInPads,
  checkHoleTraceClearance,
  checkSourceTracesMatchPcbTraceThickness,
} from "@tscircuit/checks"
import { arePortsConnected } from "@tscircuit/core-ddr-benchmark/scripts/connectivity"
import { source_trace, type AnyCircuitElement } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import type { Port } from "lib/components/primitive-components/Port"
import type { NativeH3Source } from "./board"
import type { H3RoutingStage } from "./run"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import {
  getNativeH3StageCopper,
  getNativeH3SrjCopper,
  getNativeH3ViaCopperKey,
} from "./copper"

/** Assess physical wire connectivity and the pinned DDR benchmark's DRC suite.
 * All geometry comes from Core's emitted board-world mm (+X right, +Y up).
 * Synthetic source-trace rows are solely the benchmark's multi-terminal width
 * view; the saved native circuit and its copper are never modified.
 */
export const assessNativeH3Routing = ({
  circuit,
  source,
  stages,
  initialCircuitJson,
}: {
  circuit: RootCircuit
  source: NativeH3Source
  stages: H3RoutingStage[]
  initialCircuitJson: AnyCircuitElement[]
}) => {
  const circuitJson = circuit.getCircuitJson()
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const pcbTraces = circuitJson.filter(
    (element) => element.type === "pcb_trace",
  )
  const pcbVias = circuitJson.filter((element) => element.type === "pcb_via")
  const portsBySourceId = new Map(
    circuitJson
      .filter((element) => element.type === "pcb_port")
      .map((port) => [port.source_port_id, port]),
  )
  const netWidthView: AnyCircuitElement[] = circuitJson.filter(
    (element) =>
      element.type !== "source_trace" && element.type !== "pcb_trace",
  )
  const connectedNetNames: string[] = []
  const unconnectedNetNames: string[] = []
  for (const requested of source.traces) {
    const sourceNet = circuitJson
      .filter((element) => element.type === "source_net")
      .find((net) => net.name === requested.name)
    if (!sourceNet)
      throw new Error(`Native H3 net ${requested.name} is missing`)
    const members = sourceTraces.filter((trace) =>
      trace.connected_source_net_ids?.includes(sourceNet.source_net_id),
    )
    const traceIds = new Set(members.map((trace) => trace.source_trace_id))
    traceIds.add(sourceNet.source_net_id)
    const netRoutes = pcbTraces.filter((trace) =>
      traceIds.has(trace.source_trace_id!),
    )
    const memberPortIds = new Set(
      members.flatMap((trace) => trace.connected_source_port_ids),
    )
    const expectedPortIds = requested.path.map((selector) => {
      const port = circuit.firstChild?.selectOne<Port>(selector, {
        type: "port",
      })
      if (!port?.source_port_id) {
        throw new Error(`Native H3 port ${selector} is missing`)
      }
      return port.source_port_id
    })
    netWidthView.push(
      source_trace.parse({
        type: "source_trace",
        source_trace_id: sourceNet.source_net_id,
        name: requested.name,
        connected_source_port_ids: expectedPortIds,
        connected_source_net_ids: [sourceNet.source_net_id],
        min_trace_thickness: requested.width,
      }),
      ...netRoutes.map((trace) => ({
        ...trace,
        source_trace_id: sourceNet.source_net_id,
      })),
    )
    const connected =
      expectedPortIds.every((portId) => memberPortIds.has(portId)) &&
      memberPortIds.size === expectedPortIds.length &&
      arePortsConnected(expectedPortIds, netRoutes, portsBySourceId, pcbVias)
    ;(connected ? connectedNetNames : unconnectedNetNames).push(requested.name)
  }
  const options = { minClearance: source.rules.appliedGlobalClearance }
  const findings = {
    missing_traces: checkSourceTracesHavePcbTraces(circuitJson),
    disconnected_ports: checkEachPcbPortConnectedToPcbTraces(circuitJson),
    trace_overlap: checkEachPcbTraceNonOverlapping(circuitJson, options),
    pad_trace: checkPadTraceClearance(circuitJson, options),
    via_trace: checkViaTraceClearance(circuitJson, options),
    via_pad: checkViaPadClearance(circuitJson, options),
    via_spacing: checkDifferentNetViaSpacing(circuitJson),
    contiguous: checkTracesAreContiguous(circuitJson),
    via_in_pad: checkViasInPads(circuitJson),
    hole_trace: checkHoleTraceClearance(circuitJson, options),
    width: [
      ...checkSourceTracesMatchPcbTraceThickness(circuitJson),
      ...checkSourceTracesMatchPcbTraceThickness(netWidthView),
    ],
  }
  const warnings = Object.fromEntries(
    Object.entries(findings).map(([name, results]) => [
      name,
      results.filter((finding) => finding.type.endsWith("_warning")).length,
    ]),
  )
  const findingsByType = new Map<AnyCircuitElement["type"], number>()
  for (const finding of Object.values(findings).flat())
    findingsByType.set(
      finding.type,
      (findingsByType.get(finding.type) ?? 0) + 1,
    )
  // The official benchmark counts only _error records. Width checking returns
  // typed warnings, so retain that comparable score and gate these separately.
  const requestedWidthViolationCount = findings.width.length
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const suppliedCopper = stages[0]
    ? getNativeH3SrjCopper(stages[0].start.simpleRouteJson)
    : []
  const seenVias = new Set(
    [...initialCircuitJson, ...suppliedCopper]
      .filter((element) => element.type === "pcb_via")
      .map(getNativeH3ViaCopperKey),
  )
  const phaseViaPad = stages.map((stage) => {
    const rules = stage.start.simpleRouteJson
    // Same precedence/max rule as the native bridge's landing clearance
    // (bus-lanes pending-pad-geometry.ts). Generic pad clearance can exceed
    // the fixture's global0.0889mm rule; never silently score only the latter.
    const minClearance = Math.max(
      rules.minViaEdgeToPadEdgeClearance ??
        rules.minTraceToPadEdgeClearance ??
        rules.defaultObstacleMargin ??
        0.075,
      rules.minPadEdgeToPadEdgeClearance ?? 0,
    )
    const newViaKeys = new Set(
      getNativeH3StageCopper(stage)
        .filter((element) => element.type === "pcb_via")
        .map(getNativeH3ViaCopperKey)
        .filter((key) => !seenVias.has(key)),
    )
    for (const key of newViaKeys) seenVias.add(key)
    const finalViaKeys = new Set(
      pcbVias.map(getNativeH3ViaCopperKey).filter((key) => newViaKeys.has(key)),
    )
    // Only new barrels belong to this phase's manufacture rules. Keep the
    // full final electrical map/pads/traces, without retroactively imposing
    // a later phase's clearance on already supplied copper.
    const phaseView = circuitJson.filter(
      (element) =>
        element.type !== "pcb_via" ||
        newViaKeys.has(getNativeH3ViaCopperKey(element)),
    )
    const phaseFindings = checkViaPadClearance(phaseView, {
      connMap,
      minClearance,
    })
    return {
      phaseName: stage.start.phaseName,
      completed: stage.end !== undefined,
      minClearance,
      minViaEdgeToPadEdgeClearance: rules.minViaEdgeToPadEdgeClearance,
      minPadEdgeToPadEdgeClearance: rules.minPadEdgeToPadEdgeClearance,
      newlyGeneratedViaCount: newViaKeys.size,
      matchedFinalViaCount: finalViaKeys.size,
      findings: phaseFindings,
      errorCount: phaseFindings.filter((finding) =>
        finding.type.endsWith("_error"),
      ).length,
    }
  })
  return {
    requestedNets: source.traces.length,
    connectedNets: connectedNetNames.length,
    connectedNetNames,
    unconnectedNetNames,
    findings,
    warnings,
    findingsByType: Object.fromEntries(findingsByType),
    requestedWidthViolationCount,
    phaseViaPad,
    drc: Object.fromEntries(
      Object.entries(findings).map(([name, findings]) => [
        name,
        findings.filter((finding) => finding.type.endsWith("_error")).length,
      ]),
    ),
  }
}
