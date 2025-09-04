import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"

export function applyTracesFromSolverOutput(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  pinIdToSchematicPortId: Map<string, string>
  pairKeyToSourceTraceId: Map<string, string>
  schPortIdToSourcePortId: Map<string, string>
  userNetIdToSck: Map<string, string>
}) {
  const { group, solver, pinIdToSchematicPortId, userNetIdToSck } = args
  const { db } = group.root!

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap
  const pendingTraces: Array<{
    source_trace_id: string
    edges: SchematicTrace["edges"]
    subcircuit_connectivity_map_key?: string
  }> = []

  const getSubcircuitConnectivityMapKeyFromMspPair = (
    solvedTracePath: any,
  ): string | undefined => {
    const globalConnMap: ConnectivityMap =
      solver.mspConnectionPairSolver?.globalConnMap!
    if (!globalConnMap) return undefined
    if (
      !Array.isArray(solvedTracePath?.pins) ||
      solvedTracePath.pins.length === 0
    )
      return undefined
    return userNetIdToSck.get(String(solvedTracePath.userNetId))
  }

  for (const solvedTracePath of Object.values(correctedMap ?? {})) {
    const points = solvedTracePath?.tracePath as Array<{ x: number; y: number }>
    if (!Array.isArray(points) || points.length < 2) continue

    const edges: SchematicTrace["edges"] = []
    for (let i = 0; i < points.length - 1; i++) {
      edges.push({
        from: { x: points[i]!.x, y: points[i]!.y },
        to: { x: points[i + 1]!.x, y: points[i + 1]!.y },
      })
    }

    // Try to associate with an existing source_trace_id when this is a direct connection
    let source_trace_id: string | null = null
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

        subcircuit_connectivity_map_key =
          getSubcircuitConnectivityMapKeyFromMspPair(solvedTracePath)
      }
    }

    if (!source_trace_id) {
      source_trace_id = `solver_${solvedTracePath?.mspPairId!}`
      subcircuit_connectivity_map_key =
        getSubcircuitConnectivityMapKeyFromMspPair(solvedTracePath)
    }

    pendingTraces.push({
      source_trace_id,
      edges,
      subcircuit_connectivity_map_key,
    })
  }

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
