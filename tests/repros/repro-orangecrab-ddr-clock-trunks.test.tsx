import { expect, test } from "bun:test"
import {
  checkDifferentNetViaSpacing,
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkTracesAreContiguous,
  checkViaPadClearance,
  checkViasInPads,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import {
  orangeCrabClockSnapshotOptions,
  renderOrangeCrabDdrClock,
} from "tests/fixtures/orangecrab-ddr-clock/render"

async function verifyOrangeCrabClockTrunks(): Promise<void> {
  const { circuit, inputs, asyncErrors, solverNames } =
    await renderOrangeCrabDdrClock()
  const sourceTraces = circuit.db.source_trace.list()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(387)
  expect(sourceTraces).toHaveLength(54)
  expect(
    new Set(sourceTraces.map((trace) => trace.subcircuit_connectivity_map_key))
      .size,
  ).toBe(51)
  for (const polarity of ["P", "N"]) {
    expect(
      circuit.db.source_trace.getWhere({ name: `CK_${polarity}_TRUNK` })!
        .subcircuit_connectivity_map_key,
    ).toBe(
      circuit.db.source_trace.getWhere({ name: `CK_${polarity}_TAP` })!
        .subcircuit_connectivity_map_key,
    )
  }
  // Snapshot published Circuit JSON even when the known bug stops routing.
  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path,
    orangeCrabClockSnapshotOptions,
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()).toHaveLength(4)
  expect(asyncErrors).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(inputs).toHaveLength(1)
  expect(solverNames).toEqual(["BusLanesPipelineSolver"])

  const clockSourceTraces = ["CK_P_TRUNK", "CK_N_TRUNK"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!,
  )
  const clockSourceTraceIds = clockSourceTraces.map(
    (trace) => trace.source_trace_id,
  )
  expect(
    inputs[0].connections.map((connection) => connection.source_trace_id),
  ).toEqual(clockSourceTraceIds)
  expect(inputs[0].buses).toMatchObject([
    { name: "DDR_CLOCK", allowedLayers: ["inner3"], maxLengthSkew: 0.1 },
  ])
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [clockSourceTraceIds[0], clockSourceTraceIds[1]],
      lengthTolerance: 0.1,
      traceGap: 0.089,
    },
  ])
  expect(
    circuit.db.source_bus.getWhere({ name: "CK_PAIR" })!.source_trace_ids,
  ).toEqual(clockSourceTraceIds)
  const lengths = clockSourceTraces.map((sourceTrace) => {
    const pcbTrace = circuit.db.pcb_trace.getWhere({
      source_trace_id: sourceTrace.source_trace_id,
    })!
    const endpoints = [pcbTrace.route[0], pcbTrace.route.at(-1)!]
    for (const [endpointIndex, endpoint] of endpoints.entries()) {
      if (endpoint.route_type !== "wire")
        throw new Error("Expected a top-layer clock pad endpoint")
      const port = circuit.db.pcb_port.getWhere({
        source_port_id: sourceTrace.connected_source_port_ids[endpointIndex],
      })!
      expect(endpoint.layer).toBe("top")
      expect(endpoint.x).toBeCloseTo(port.x!, 8)
      expect(endpoint.y).toBeCloseTo(port.y!, 8)
    }
    return pcbTrace.route.slice(1).reduce((total, point, routeIndex) => {
      const previous = pcbTrace.route[routeIndex]
      return point.route_type === "wire" &&
        previous.route_type === "wire" &&
        point.layer === previous.layer
        ? total + Math.hypot(point.x - previous.x, point.y - previous.y)
        : total
    }, 0)
  })
  expect(Math.abs(lengths[0] - lengths[1])).toBeLessThanOrEqual(0.100001)
  const json = circuit.getCircuitJson()
  const physicalErrors = [
    ...checkEachPcbTraceNonOverlapping(json, { minClearance: 0.089 }),
    ...checkPadTraceClearance(json, { minClearance: 0.089 }),
    ...checkViaTraceClearance(json, { minClearance: 0.089 }),
    ...checkViaPadClearance(json, { minClearance: 0.089 }),
    ...checkDifferentNetViaSpacing(json),
    ...checkViasInPads(json),
    ...checkTracesAreContiguous(json),
  ].filter((finding) => finding.type.endsWith("_error"))
  expect(physicalErrors).toEqual([])
}

// Expected failure on the repro branch. The stacked fix removes .failing;
// the geometry, source connectivity and routing assertions stay identical.
test.failing(
  "routes the real OrangeCrab clock trunks while keeping termination taps on their nets",
  verifyOrangeCrabClockTrunks,
  60_000,
)
