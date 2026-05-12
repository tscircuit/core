import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import Debug from "debug"

const debug = Debug("Group_doInitialSchematicTraceRender")

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

    const points = solvedTracePath?.tracePath as Array<{ x: number; y: number }>
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
    })),
  )
  const junctionsById = computeJunctions(withCrossings)

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
