import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
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
  const {
    group,
    solver,
    pinIdToSchematicPortId,
    pairKeyToSourceTraceId,
    schPortIdToSourcePortId,
    userNetIdToSck,
  } = args
  const { db } = group.root!

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap
  const pendingTraces: Array<{
    source_trace_id: string
    edges: SchematicTrace["edges"]
    subcircuit_connectivity_map_key?: string
  }> = []

  const getSubcircuitConnectivityMapKeyFromSourceTrace = (
    source_trace_id?: string | null,
  ) => {
    if (!source_trace_id) return undefined
    return db.source_trace.get(source_trace_id)?.subcircuit_connectivity_map_key
  }

  const getSubcircuitConnectivityMapKeyFromMspPair = (
    solvedTracePath: any,
  ): string | undefined => {
    const globalConnMap: any = solver.mspConnectionPairSolver?.globalConnMap
    if (!globalConnMap) return undefined
    if (!Array.isArray(solvedTracePath?.pins) || solvedTracePath.pins.length === 0)
      return undefined
    // Any pin in the pair is connected to exactly one net in the global map
    for (const pin of solvedTracePath.pins) {
      const userNetId = globalConnMap.getNetConnectedToId?.(pin?.pinId)
      if (!userNetId) continue
      const sck = userNetIdToSck.get(String(userNetId))
      if (sck) return sck
    }
    return undefined
  }

  const getSubcircuitConnectivityMapKeyFromTwoPorts = (
    pA?: string,
    pB?: string,
  ) => {
    if (!pA || !pB) return undefined
    const srcA = schPortIdToSourcePortId.get(pA)
    const srcB = schPortIdToSourcePortId.get(pB)
    if (!srcA || !srcB) return undefined
    const sckA = db.source_port.get(srcA)?.subcircuit_connectivity_map_key
    const sckB = db.source_port.get(srcB)?.subcircuit_connectivity_map_key
    return sckA && sckB && sckA === sckB ? sckA : undefined
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
        const pairKey = [pA, pB].sort().join("::")
        source_trace_id =
          pairKeyToSourceTraceId.get(pairKey) ||
          `solver_${solvedTracePath.mspPairId || pairKey}`

        // Mark ports as connected on schematic
        for (const schPid of [pA, pB]) {
          const existing = db.schematic_port.get(schPid)
          if (existing) db.schematic_port.update(schPid, { is_connected: true })
        }

        // Prefer SCK from MSP/global connection mapping, fallback to source_trace
        subcircuit_connectivity_map_key =
          getSubcircuitConnectivityMapKeyFromMspPair(solvedTracePath) ||
          getSubcircuitConnectivityMapKeyFromSourceTrace(source_trace_id) ||
          getSubcircuitConnectivityMapKeyFromTwoPorts(pA, pB)
      }
    }

    if (!source_trace_id) {
      source_trace_id = `solver_${solvedTracePath?.mspPairId!}`
      // Try MSP/global map even for non-direct cases
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
