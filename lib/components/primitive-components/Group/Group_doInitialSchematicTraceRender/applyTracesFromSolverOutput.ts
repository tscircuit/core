import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { type Bounds, pointToBoundsDistance } from "@tscircuit/math-utils"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
import Debug from "debug"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { Port } from "../../Port"
import { Group } from "../Group"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import { getPortForSchematicSymbolPort } from "./getPortForSchematicSymbolPort"
import { type SchematicPortId, asSchematicPortId } from "./port-id-types"
import { removeOverlappingSameNetCrossingSegments } from "./remove-overlapping-same-net-crossing-segments"

const debug = Debug("Group_doInitialSchematicTraceRender")

const MAX_PIN_SNAP_GAP = 1.5

/**
 * Adds the internal pin stub omitted by the schematic trace solver.
 *
 * A component's routing box can be expanded to include its text, placing its
 * actual pins inside the box. The solver intentionally projects those pins to
 * the box edge. Core already closes small solver-to-pin gaps; for larger gaps,
 * only connect the endpoint back to the real pin when it lies within that
 * component's text-expanded bounds.
 */
function extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
  params: {
    points: Array<{ x: number; y: number }>
    schematicPortIds: SchematicPortId[]
    expandedBoundsByPortId: Map<SchematicPortId, Bounds>
  },
  db: CircuitJsonUtilObjects,
): Array<{ x: number; y: number }> {
  const { points, schematicPortIds, expandedBoundsByPortId } = params
  const centers = schematicPortIds
    .map((id) => {
      const center = db.schematic_port.get(id)?.center
      const bounds = expandedBoundsByPortId.get(id)
      if (!center || !bounds) return null
      return { center, bounds }
    })
    .filter(
      (
        port,
      ): port is {
        center: { x: number; y: number }
        bounds: Bounds
      } => Boolean(port),
    )
  if (centers.length === 0) return points

  const result = points.map((p) => ({ x: p.x, y: p.y }))
  const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  const usedCenters = new Set<number>()

  for (let i = 0; i < centers.length; i++) {
    if (result.some((p) => d2(centers[i]!.center, p) <= 1e-12)) {
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
      const { center, bounds } = centers[i]!
      const dist = d2(center, endpointPoint)
      if (
        Math.abs(center.x - endpointPoint.x) > ALIGN_EPS &&
        Math.abs(center.y - endpointPoint.y) > ALIGN_EPS
      ) {
        continue
      }
      if (
        dist > MAX_PIN_SNAP_GAP ** 2 &&
        pointToBoundsDistance(endpointPoint, bounds) > ALIGN_EPS
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
    const center = centers[centerIndex]!.center
    if (endpoint === "start") result.unshift({ x: center.x, y: center.y })
    else result.push({ x: center.x, y: center.y })
  }
  return result
}

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

  const schematicPortIdsByRoutedSchematicPortId = new Map<
    SchematicPortId,
    SchematicPortId[]
  >()
  for (const port of group.selectAll<Port>("port")) {
    const routedSchematicPortIdValue =
      getPortForSchematicSymbolPort(port).schematic_port_id
    const schematicPortIdValue = port.schematic_port_id
    if (!routedSchematicPortIdValue || !schematicPortIdValue) continue
    const routedSchematicPortId = asSchematicPortId(routedSchematicPortIdValue)
    const schematicPortId = asSchematicPortId(schematicPortIdValue)
    const schematicPortIds =
      schematicPortIdsByRoutedSchematicPortId.get(routedSchematicPortId) ?? []
    schematicPortIds.push(schematicPortId)
    schematicPortIdsByRoutedSchematicPortId.set(
      routedSchematicPortId,
      schematicPortIds,
    )
  }

  const expandedBoundsByPortId = new Map<SchematicPortId, Bounds>()
  for (const schematicComponent of db.schematic_component.list()) {
    const bounds = getSchematicComponentWithTextBounds({
      db,
      schematicComponent,
    })
    if (!bounds) continue
    for (const port of db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })) {
      expandedBoundsByPortId.set(
        asSchematicPortId(port.schematic_port_id),
        bounds,
      )
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

    const snappedPoints =
      extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
        {
          points,
          schematicPortIds: solvedTraceSchematicPortIds,
          expandedBoundsByPortId,
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
          for (const schematicPortId of schematicPortIdsByRoutedSchematicPortId.get(
            routedSchematicPortId,
          ) ?? []) {
            db.schematic_port.update(schematicPortId, {
              is_connected: true,
            })
          }
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
