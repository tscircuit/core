import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
import Debug from "debug"
import { Group } from "../Group"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"
import { removeOverlappingSameNetCrossingSegments } from "./remove-overlapping-same-net-crossing-segments"

const debug = Debug("Group_doInitialSchematicTraceRender")

export function applyTracesFromSolverOutput(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToConnKey: Map<string, string>
  schematicPortIdsWithPreExistingNetLabels: Set<SchematicPortId>
}) {
  const {
    group,
    solver,
    userNetIdToConnKey,
    schematicPortIdsWithPreExistingNetLabels,
  } = args
  const { db } = group.root!

  // Use the final pipeline output so same-net branches share clean junctions.
  const traces =
    solver.inlineNetLabelSolver?.getOutput().traces ??
    solver.sameNetJunctionAlignmentSolver?.getOutput().traces ??
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
    const solvedTraceSchematicPortIds = uniquePinIds.map(asSchematicPortId)
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

    const edges: SchematicTrace["edges"] = []
    for (let i = 0; i < points.length - 1; i++) {
      edges.push({
        from: { x: points[i]!.x, y: points[i]!.y },
        to: { x: points[i + 1]!.x, y: points[i + 1]!.y },
      })
    }

    const source_trace_id = String(solvedTracePath?.mspPairId)
    let subcircuit_connectivity_map_key: string | undefined
    if (
      Array.isArray(solvedTracePath?.pins) &&
      solvedTracePath.pins.length === 2
    ) {
      const firstPinId = solvedTracePath.pins[0]?.pinId
      const secondPinId = solvedTracePath.pins[1]?.pinId
      const pA = firstPinId ? asSchematicPortId(firstPinId) : undefined
      const pB = secondPinId ? asSchematicPortId(secondPinId) : undefined
      if (pA && pB) {
        // Mark ports as connected on schematic
        const routedSchematicPortIds = new Set([pA, pB])
        for (const routedSchematicPortId of routedSchematicPortIds) {
          db.schematic_port.update(routedSchematicPortId, {
            is_connected: true,
          })
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
