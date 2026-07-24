import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicTrace } from "circuit-json"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import { removeOverlappingSameNetCrossingSegments } from "./remove-overlapping-same-net-crossing-segments"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import Debug from "debug"

const debug = Debug("Group_doInitialSchematicTraceRender")

const MAX_PIN_SNAP_GAP = 1.5

/**
 * Extends a trace's start/end to land on a pin center.
 *
 * When a schematic component's bounding box is expanded to fit large text,
 * the box can grow large enough that the component's pins end up *inside* the
 * box. The trace solver routes up to the edge of the bounding box, so the
 * trace stops short of the pin and never visually connects. This walks each
 * endpoint to the nearest eligible pin center (within MAX_PIN_SNAP_GAP, and
 * only if axis-aligned), prepending/appending a point so the trace reaches
 * the pin.
 */
function extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
  params: {
    points: Array<{ x: number; y: number }>
    schematicPortIds: string[]
    eligiblePortIds: Set<string>
  },
  db: CircuitJsonUtilObjects,
): Array<{ x: number; y: number }> {
  const { points, schematicPortIds, eligiblePortIds } = params
  const centers = schematicPortIds
    .filter((id) => eligiblePortIds.has(id))
    .map((id) => db.schematic_port.get(id)?.center)
    .filter((c): c is { x: number; y: number } => Boolean(c))
  if (centers.length === 0) return points

  const result = points.map((p) => ({ x: p.x, y: p.y }))
  const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  const usedCenters = new Set<number>()

  for (let i = 0; i < centers.length; i++) {
    if (result.some((p) => d2(centers[i]!, p) <= 1e-12)) {
      usedCenters.add(i)
    }
  }

  const ALIGN_EPS = 1e-3
  const endpoints: Array<"start" | "end"> = ["start", "end"]
  const candidates: Array<{
    endpoint: "start" | "end"
    centerIndex: number
    dist: number
  }> = []
  for (const endpoint of endpoints) {
    const endpointPoint =
      endpoint === "start" ? result[0]! : result[result.length - 1]!
    for (let i = 0; i < centers.length; i++) {
      if (usedCenters.has(i)) continue
      const center = centers[i]!
      const dist = d2(center, endpointPoint)
      if (dist > MAX_PIN_SNAP_GAP ** 2) continue
      if (
        Math.abs(center.x - endpointPoint.x) > ALIGN_EPS &&
        Math.abs(center.y - endpointPoint.y) > ALIGN_EPS
      ) {
        continue
      }
      candidates.push({ endpoint, centerIndex: i, dist })
    }
  }
  candidates.sort((a, b) => a.dist - b.dist)

  const usedEndpoints = new Set<"start" | "end">()
  for (const { endpoint, centerIndex, dist } of candidates) {
    if (usedEndpoints.has(endpoint) || usedCenters.has(centerIndex)) continue
    usedCenters.add(centerIndex)
    usedEndpoints.add(endpoint)
    if (dist <= 1e-12) continue
    const center = centers[centerIndex]!
    if (endpoint === "start") result.unshift({ x: center.x, y: center.y })
    else result.push({ x: center.x, y: center.y })
  }
  return result
}

export function applyTracesFromSolverOutput(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  pinIdToSchematicPortId: Map<string, string>
  userNetIdToConnKey: Map<string, string>
  schematicPortIdsWithPreExistingNetLabels: Set<string>
}) {
  const {
    group,
    solver,
    pinIdToSchematicPortId,
    userNetIdToConnKey,
    schematicPortIdsWithPreExistingNetLabels,
  } = args
  const { db } = group.root!

  const eligiblePortIds = new Set<string>()
  for (const schematicComponent of db.schematic_component.list()) {
    if (!getSchematicComponentWithTextBounds({ db, schematicComponent })) {
      continue
    }
    for (const port of db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })) {
      eligiblePortIds.add(port.schematic_port_id)
    }
  }

  // Use the overlap-corrected traces from the pipeline
  const traces =
    solver.netLabelTraceCollisionSolver?.getOutput().traces ??
    solver.traceCleanupSolver?.getOutput().traces ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().traces ??
    solver.schematicTraceLinesSolver?.solvedTracePaths
  const pendingTraces: Array<{
    source_trace_id: string
    edges: SchematicTrace["edges"]
    subcircuit_connectivity_map_key?: string
    schematic_sheet_id?: string
  }> = []

  debug(`Traces inside SchematicTraceSolver output: ${(traces ?? []).length}`)

  for (const solvedTracePath of traces ?? []) {
    const uniquePinIds = Array.from(new Set(solvedTracePath.pinIds ?? []))
    const solvedTraceSchematicPortIds = uniquePinIds
      .map((pinId) => pinIdToSchematicPortId.get(pinId))
      .filter((id): id is string => Boolean(id))
    const isNetLabelCoveredTrace =
      solvedTraceSchematicPortIds.length > 0 &&
      solvedTraceSchematicPortIds.every((id) =>
        schematicPortIdsWithPreExistingNetLabels.has(id),
      )
    if (isNetLabelCoveredTrace) {
      debug(
        `Skipping solver netlabel-covered trace ${solvedTracePath?.mspPairId} because all schematic ports already have netlabels`,
      )
      continue
    }

    const points = solvedTracePath?.tracePath as Array<{
      x: number
      y: number
    }>
    if (!Array.isArray(points) || points.length < 2) {
      debug(
        `Skipping trace ${solvedTracePath?.pinIds.join(",")} because it has less than 2 points`,
      )
      continue
    }

    const snappedPoints =
      extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
        {
          points,
          schematicPortIds: solvedTraceSchematicPortIds,
          eligiblePortIds,
        },
        db,
      )

    const edges: SchematicTrace["edges"] = []
    for (let i = 0; i < snappedPoints.length - 1; i++) {
      edges.push({
        from: { x: snappedPoints[i]!.x, y: snappedPoints[i]!.y },
        to: { x: snappedPoints[i + 1]!.x, y: snappedPoints[i + 1]!.y },
      })
    }

    const source_trace_id = String(solvedTracePath?.mspPairId)
    let subcircuit_connectivity_map_key: string | undefined
    if (
      Array.isArray(solvedTracePath?.pins) &&
      solvedTracePath.pins.length === 2
    ) {
      const pA = pinIdToSchematicPortId.get(solvedTracePath.pins[0]?.pinId!)
      const pB = pinIdToSchematicPortId.get(solvedTracePath.pins[1]?.pinId!)
      if (pA && pB) {
        // Mark ports as connected on schematic
        for (const schPid of [pA, pB]) {
          const existing = db.schematic_port.get(schPid)
          if (existing) db.schematic_port.update(schPid, { is_connected: true })
        }

        subcircuit_connectivity_map_key = userNetIdToConnKey.get(
          String(solvedTracePath.userNetId),
        )
      }
    }
    if (!subcircuit_connectivity_map_key) {
      subcircuit_connectivity_map_key = userNetIdToConnKey.get(
        String(solvedTracePath.userNetId),
      )
    }
    if (!subcircuit_connectivity_map_key) {
      const sourcePortConnKeys = solvedTraceSchematicPortIds
        .map((schematicPortId) => {
          const schematicPort = db.schematic_port.get(schematicPortId)
          const sourcePortId = schematicPort?.source_port_id
          if (!sourcePortId) return undefined
          return db.source_port.get(sourcePortId)
            ?.subcircuit_connectivity_map_key
        })
        .filter((key): key is string => Boolean(key))
      const uniqueSourcePortConnKeys = new Set(sourcePortConnKeys)
      if (uniqueSourcePortConnKeys.size === 1) {
        subcircuit_connectivity_map_key = sourcePortConnKeys[0]
      }
    }

    // Solver traces belong to the sheet shared by their endpoint ports.
    const endpointSchematicSheetIds = new Set(
      solvedTraceSchematicPortIds
        .map(
          (schematicPortId) =>
            db.schematic_port.get(schematicPortId)?.schematic_sheet_id,
        )
        .filter((sheetId): sheetId is string => Boolean(sheetId)),
    )
    let schematicSheetId: string | undefined
    if (endpointSchematicSheetIds.size === 1) {
      schematicSheetId = endpointSchematicSheetIds.values().next().value
    } else if (endpointSchematicSheetIds.size === 0) {
      schematicSheetId = group._resolveSchematicSheetId()
    }

    pendingTraces.push({
      source_trace_id,
      edges,
      subcircuit_connectivity_map_key,
      schematic_sheet_id: schematicSheetId,
    })
  }

  debug(
    `Applying ${pendingTraces.length} traces from SchematicTraceSolver output`,
  )

  // Compute crossings and junctions without relying on DB lookups
  const withCrossings = computeCrossings(
    pendingTraces.map((t) => ({
      source_trace_id: t.source_trace_id,
      edges: t.edges,
      connectivity_key: t.subcircuit_connectivity_map_key,
    })),
  )
  const existingTracesForJunctions: Array<{
    schematic_trace_id: string
    source_trace_id: string
    edges: SchematicTrace["edges"]
    connectivity_key?: string
  }> = []
  const schematicSheetId = group._resolveSchematicSheetId()
  for (const t of db.schematic_trace.list()) {
    if (t.edges.length === 0) continue
    if (t.schematic_sheet_id !== schematicSheetId) continue
    const sourceTrace = t.source_trace_id
      ? db.source_trace.get(t.source_trace_id)
      : undefined
    existingTracesForJunctions.push({
      schematic_trace_id: t.schematic_trace_id,
      source_trace_id: t.source_trace_id ?? t.schematic_trace_id,
      edges: t.edges,
      connectivity_key:
        t.subcircuit_connectivity_map_key ??
        sourceTrace?.subcircuit_connectivity_map_key,
    })
  }
  const tracesWithTrimmedCrossingOverlaps =
    removeOverlappingSameNetCrossingSegments([
      ...withCrossings,
      ...existingTracesForJunctions,
    ])
  const visibleTraces = tracesWithTrimmedCrossingOverlaps.slice(
    0,
    withCrossings.length,
  )
  const visibleExistingTraces = tracesWithTrimmedCrossingOverlaps.slice(
    withCrossings.length,
  )

  for (const trace of visibleExistingTraces) {
    if (!trace.schematic_trace_id) continue
    db.schematic_trace.update(trace.schematic_trace_id, {
      edges: trace.edges,
    })
  }

  const junctionsById = computeJunctions([
    ...visibleTraces,
    ...visibleExistingTraces,
  ])

  for (const t of visibleTraces) {
    const pendingTrace = pendingTraces.find(
      (pendingTrace) => pendingTrace.source_trace_id === t.source_trace_id,
    )
    let traceSchematicSheetId = schematicSheetId
    if (pendingTrace?.schematic_sheet_id) {
      traceSchematicSheetId = pendingTrace.schematic_sheet_id
    }
    db.schematic_trace.insert({
      source_trace_id: t.source_trace_id,
      edges: t.edges,
      junctions: junctionsById[t.source_trace_id] ?? [],
      subcircuit_connectivity_map_key:
        pendingTrace?.subcircuit_connectivity_map_key,
      schematic_sheet_id: traceSchematicSheetId,
    })
  }
}
