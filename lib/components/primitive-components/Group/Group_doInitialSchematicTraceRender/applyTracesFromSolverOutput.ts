import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicTrace } from "circuit-json"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import Debug from "debug"

const debug = Debug("Group_doInitialSchematicTraceRender")

const MAX_PIN_SNAP_GAP = 1.5

function completeTraceEndpointsToPins(
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

  const snap = (endpoint: "start" | "end") => {
    const pt = endpoint === "start" ? result[0]! : result[result.length - 1]!
    let bestIndex = -1
    let bestDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < centers.length; i++) {
      if (usedCenters.has(i)) continue
      const dist = d2(centers[i]!, pt)
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = i
      }
    }
    if (bestIndex < 0) return
    if (bestDist <= 1e-12) {
      usedCenters.add(bestIndex)
      return
    }
    if (bestDist > MAX_PIN_SNAP_GAP ** 2) return
    const c = centers[bestIndex]!
    const ALIGN_EPS = 1e-3
    if (Math.abs(c.x - pt.x) > ALIGN_EPS && Math.abs(c.y - pt.y) > ALIGN_EPS) {
      return
    }
    usedCenters.add(bestIndex)
    if (endpoint === "start") result.unshift({ x: c.x, y: c.y })
    else result.push({ x: c.x, y: c.y })
  }

  snap("start")
  snap("end")
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
    if (!getSchematicComponentWithTextBounds(db, schematicComponent)) {
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
  }> = []

  debug(`Traces inside SchematicTraceSolver output: ${(traces ?? []).length}`)

  for (const solvedTracePath of traces ?? []) {
    const uniquePinIds = Array.from(new Set(solvedTracePath.pinIds ?? []))
    const solvedTraceSchematicPortIds = uniquePinIds
      .map((pinId) => pinIdToSchematicPortId.get(pinId))
      .filter((id): id is string => Boolean(id))
    const isNetLabelStubTrace =
      uniquePinIds.length <= 1 &&
      solvedTraceSchematicPortIds.length > 0 &&
      solvedTraceSchematicPortIds.every((id) =>
        schematicPortIdsWithPreExistingNetLabels.has(id),
      )
    if (isNetLabelStubTrace) {
      debug(
        `Skipping solver netlabel stub trace ${solvedTracePath?.mspPairId} because schematic port already has a netlabel`,
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

    const snappedPoints = completeTraceEndpointsToPins(
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

    pendingTraces.push({
      source_trace_id,
      edges,
      subcircuit_connectivity_map_key,
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
    source_trace_id: string
    edges: SchematicTrace["edges"]
    connectivity_key?: string
  }> = []
  for (const t of db.schematic_trace.list()) {
    if (!t.source_trace_id || t.edges.length === 0) continue
    const sourceTrace = db.source_trace.get(t.source_trace_id)
    existingTracesForJunctions.push({
      source_trace_id: t.source_trace_id,
      edges: t.edges,
      connectivity_key:
        t.subcircuit_connectivity_map_key ??
        sourceTrace?.subcircuit_connectivity_map_key,
    })
  }
  const junctionsById = computeJunctions([
    ...withCrossings,
    ...existingTracesForJunctions,
  ])

  for (const t of withCrossings) {
    db.schematic_trace.insert({
      source_trace_id: t.source_trace_id,
      edges: t.edges,
      junctions: junctionsById[t.source_trace_id] ?? [],
      subcircuit_connectivity_map_key: pendingTraces.find(
        (p) => p.source_trace_id === t.source_trace_id,
      )?.subcircuit_connectivity_map_key,
    })
  }
}
