import { expect, test } from "bun:test"
import "tests/fixtures/extend-expect-any-svg"
import { isDeepStrictEqual } from "node:util"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import {
  getNativeH3Geometry,
  runNativeH3Routing,
} from "tests/fixtures/h3-routing-phase-intent/run"
import { assessNativeH3Routing } from "tests/fixtures/h3-routing-phase-intent/assess"
import { getH3RoutedSnapshot } from "tests/fixtures/h3-routing-phase-intent/routed-snapshot"
import { getNativeH3CopperPreservation } from "tests/fixtures/h3-routing-phase-intent/copper"
import { getNativeH3AccessEvidence } from "tests/fixtures/h3-routing-phase-intent/access-evidence"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"

test("native H3 preserves pending pad access through all actual routing phases", async () => {
  const result = await runNativeH3Routing(new RootCircuit())
  const { circuit, source, stages, circuitJson } = result
  const assessment = assessNativeH3Routing({
    circuit,
    source,
    stages,
    initialCircuitJson: result.initialCircuitJson,
  })
  const drcErrors = Object.values(assessment.drc).reduce(
    (sum, count) => sum + count,
    0,
  )
  const accessEvidence = getNativeH3AccessEvidence({
    stages,
    solverNames: result.solverNames,
  })
  const warningCount = Object.values(assessment.warnings).reduce(
    (sum, count) => sum + count,
    0,
  )
  const reports = stages.map(
    (stage) => stage.solverEnded?.pendingRoutingAccessReport,
  )
  const geometryPreserved = isDeepStrictEqual(
    getNativeH3Geometry(circuitJson),
    result.initialGeometry,
  )
  const copper = getNativeH3CopperPreservation({ stages, circuitJson })
  const accessCaptions = [0, 1].map((stageIndex) => {
    const report = reports[stageIndex]
    return report
      ? `Byte ${stageIndex}: ${report.baselineAccessibleFramedTerminalCount}/${report.framedTerminalCount} future terminals initially accessible; ${report.baselineInaccessibleFramedTerminalCount} already inaccessible; ${report.newlyBlockedConnectionNames.length} newly blocked nets`
      : `Byte ${stageIndex}: no accepted future-access report`
  })

  expect(result.renderMs).toBeLessThan(300_000)
  expect(result.renderError).toBeUndefined()
  expect(accessEvidence).toEqual({
    phaseOrderVerified: true,
    solverOrderVerified: true,
    futureRequestsVerified: true,
    solverInputVerified: true,
    reportsVerified: true,
  })
  expect(stages.map((stage) => stage.start.phaseName)).toEqual([
    "byte0",
    "byte1",
    "remaining",
  ])
  expect(stages.map((stage) => stage.start.solverName)).toEqual([
    "BusLanesPipelineSolver",
    "BusLanesPipelineSolver",
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ])
  expect(result.solverNames).toEqual(
    stages.map((stage) => stage.start.solverName!),
  )
  expect(stages.every((stage) => stage.end && !stage.error)).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(result.initialCircuitJson.filter((element) => element.type === "pcb_trace" || element.type === "pcb_via")).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(445)
  expect(getNativeH3Geometry(circuitJson)).toEqual(result.initialGeometry)
  expect(
    stages.map((stage) =>
      stage.start.simpleRouteJson.pendingRoutingAccess?.map(
        (access) => access.connections.length,
      ),
    ),
  ).toEqual([[8, 37], [37], undefined])
  expect(reports.map((report) => report?.declaredConnectionCount)).toEqual([
    45,
    37,
    undefined,
  ])
  expect(reports.map((report) => report?.declaredTerminalCount)).toEqual([
    92,
    76,
    undefined,
  ])
  expect(reports.map((report) => report?.framedTerminalCount)).toEqual([
    92,
    76,
    undefined,
  ])
  for (const [stageIndex, stage] of stages.slice(0, 2).entries()) {
    expect(stage.announcedConstructorInputMatches).toBe(true)
    expect(stage.observedBusInput).toEqual(
      getBusLanesInputFromSrj(stage.start.simpleRouteJson),
    )
    expect(stage.solverEnded?.solved).toBe(true)
    expect(stage.solverEnded?.failed).toBe(false)
    expect(reports[stageIndex]?.outcome).toBe("preserved")
    expect(reports[stageIndex]?.newlyBlockedConnectionNames).toEqual([])
    const report = reports[stageIndex]!
    expect(
      report.baselineAccessibleFramedTerminalCount +
        report.baselineInaccessibleFramedTerminalCount,
    ).toBe(report.framedTerminalCount)
    const { traces: priorTraces = [], ...inputProblem } =
      stage.start.simpleRouteJson
    const { traces: finalTraces = [], ...outputProblem } =
      stage.end!.simpleRouteJson
    expect(outputProblem).toEqual(inputProblem)
    for (const priorTrace of priorTraces) {
      expect(
        finalTraces.find(
          (trace) => trace.pcb_trace_id === priorTrace.pcb_trace_id,
        ),
      ).toEqual(priorTrace)
    }
    const priorTraceIds = new Set(
      priorTraces.map((trace) => trace.pcb_trace_id),
    )
    // Adapter.complete emits solver.traces verbatim; Group.runAutorouter passes
    // them through and the phase event only accumulates unchanged prior copper
    // (Group.ts eventOutputPcbTraces). Reconstruct the actual solver's physical
    // input + candidate union, not a count of post-materialization PCB rows.
    const solverUnionTraceIds = new Set([
      ...(stage.observedBusInput?.traces ?? []).map(
        (trace) => trace.pcb_trace_id,
      ),
      ...finalTraces
        .filter((trace) => !priorTraceIds.has(trace.pcb_trace_id))
        .map((trace) => trace.pcb_trace_id),
    ])
    expect(reports[stageIndex]?.validatedTraceCount).toBe(
      solverUnionTraceIds.size,
    )
  }
  expect(copper.initialToByte0Preserved).toBe(true)
  expect(copper.byte0ToByte1Preserved).toBe(true)
  // The final auto_local stage represents prior fixed traces as obstacles. Core
  // must retain the same wire copper and physical via barrels on each net.
  expect(copper.byte1ToFinalPreserved).toBe(true)
  expect(assessment.requestedWidthViolationCount).toBe(0)
  expect(
    assessment.phaseViaPad.every(
      (phase) =>
        phase.completed &&
        phase.errorCount === 0 &&
        phase.matchedFinalViaCount === phase.newlyGeneratedViaCount,
    ),
  ).toBe(true)
  expect(assessment.connectedNets).toBe(53)
  expect(assessment.unconnectedNetNames).toEqual([])
  expect(assessment.drc).toEqual({
    missing_traces: 0,
    disconnected_ports: 0,
    trace_overlap: 0,
    pad_trace: 0,
    via_trace: 0,
    via_pad: 0,
    via_spacing: 0,
    contiguous: 0,
    via_in_pad: 0,
    hole_trace: 0,
    width: 0,
  })

  await expect(
    getH3RoutedSnapshot({
      circuitJson,
      title: "Native H3 DDR: actual bus / bus / auto_local routing",
      status: [
        `${assessment.connectedNets}/${assessment.requestedNets} physically connected nets; ${drcErrors} DRC errors; ${warningCount} warnings; ${assessment.requestedWidthViolationCount} width violations; 445 native pads`,
        ...accessCaptions,
        `Native geometry ${geometryPreserved ? "unchanged" : "CHANGED"}; byte copper ${copper.initialToByte0Preserved && copper.byte0ToByte1Preserved && copper.byte1ToFinalPreserved ? "unchanged" : "changed or missing"}. Timing unqualified.`,
      ],
    }),
  ).toMatchSvgSnapshot(import.meta.path, "h3-pending-access-consumer-routed", {
    diffThresholdPercent: 0,
  })
  for (const [stageIndex, stage] of stages.slice(0, 2).entries()) {
    await expect(
      getH3RoutedSnapshot({
        circuitJson,
        stage,
        title: `Native H3 after byte ${stageIndex}: actual copper and future terminals`,
        status: [
          `${stage.end?.simpleRouteJson.traces?.length ?? 0} accumulated traces; ${stage.start.simpleRouteJson.pendingRoutingAccess?.flatMap((access) => access.connections).length ?? 0} declared future connections`,
          accessCaptions[stageIndex]!,
          "Teal crosses mark explicitly pending native pads; solid paths are routed copper.",
        ],
      }),
    ).toMatchSvgSnapshot(
      import.meta.path,
      `h3-pending-access-consumer-byte-${stageIndex}`,
      { diffThresholdPercent: 0 },
    )
  }
}, 600_000)
