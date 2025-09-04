import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { SchematicTrace } from "circuit-json"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"

type PendingTrace = {
  // resolved later; initially may be undefined if not a direct pair
  id?: string
  // optional: preferred solver id for stable fallback/debugging
  solverId?: string
  edges: SchematicTrace["edges"]
  // endpoints (schematic port ids) if present
  endpoints?: [string, string]
  // net key for distributing trace assignments among source traces
  netKey?: string
}

export function applyTracesFromSolverOutput(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  pinIdToSchematicPortId: Map<string, string>
  pairKeyToSourceTraceId: Map<string, string>
}) {
  const { group, solver, pinIdToSchematicPortId, pairKeyToSourceTraceId } = args
  const { db } = group.root!

  // Build a connectivity map of all source traces to understand net groupings
  const connMap = new ConnectivityMap({})
  const allSourceTraces = db.source_trace.list()
  connMap.addConnections(
    allSourceTraces
      .map((st) => [
        st.source_trace_id,
        ...(st.connected_source_port_ids || []),
        ...(st.connected_source_net_ids || []),
      ])
      .filter((c) => c.length > 1),
  )

  // Pre-compute source_traces by net key for quick assignment
  const tracesByNet = new Map<string, string[]>()
  for (const st of allSourceTraces) {
    const netKey = connMap.getNetConnectedToId(st.source_trace_id)
    if (!netKey) continue
    if (!tracesByNet.has(netKey)) tracesByNet.set(netKey, [])
    tracesByNet.get(netKey)!.push(st.source_trace_id)
  }

  for (const arr of tracesByNet.values()) arr.sort()

  const getNetKeyForEndpoints = (
    endpoints?: [string, string],
  ): string | undefined => {
    if (!endpoints) return undefined
    const [pA, pB] = endpoints
    const spA = db.schematic_port.get(pA)
    const spB = db.schematic_port.get(pB)
    const netA = spA?.source_port_id
      ? connMap.getNetConnectedToId(spA.source_port_id)
      : undefined
    const netB = spB?.source_port_id
      ? connMap.getNetConnectedToId(spB.source_port_id)
      : undefined
    return netA && netA === netB ? netA : undefined
  }

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap

  const pendingTraces: PendingTrace[] = []

  for (const solved of Object.values(correctedMap ?? {})) {
    const points = solved?.tracePath as Array<{ x: number; y: number }>
    if (!Array.isArray(points) || points.length < 2) continue

    const edges: SchematicTrace["edges"] = []
    for (let i = 0; i < points.length - 1; i++) {
      edges.push({
        from: { x: points[i]!.x, y: points[i]!.y },
        to: { x: points[i + 1]!.x, y: points[i + 1]!.y },
      })
    }

    // Determine endpoints and attempt to associate
    let endpoints: [string, string] | undefined
    let directSourceTraceId: string | undefined
    let netKey: string | undefined

    if (Array.isArray(solved?.pins) && solved.pins.length === 2) {
      const pA = pinIdToSchematicPortId.get(solved.pins[0]?.pinId!)
      const pB = pinIdToSchematicPortId.get(solved.pins[1]?.pinId!)
      if (pA && pB) {
        endpoints = [pA, pB]
        const pairKey = [pA, pB].sort().join("::")

        // Try direct mapping to a source_trace that explicitly connects these two ports
        directSourceTraceId = pairKeyToSourceTraceId.get(pairKey)

        // Mark ports as connected on schematic
        for (const schPid of [pA, pB]) {
          const existing = db.schematic_port.get(schPid)
          if (existing) db.schematic_port.update(schPid, { is_connected: true })
        }

        // Derive net key from endpoints (for grouping/distribution)
        netKey = getNetKeyForEndpoints(endpoints)
      }
    }

    pendingTraces.push({
      id: directSourceTraceId,
      solverId: `solver_${solved?.mspPairId || (endpoints ? [endpoints[0], endpoints[1]].sort().join("::") : "unknown")}`,
      edges,
      endpoints,
      netKey,
    })
  }

  // Resolve final source_trace_id assignments for pending traces using the connectivity map
  const usedByNet = new Map<string, Set<string>>()
  for (const t of pendingTraces) {
    if (t.id && t.netKey) {
      if (!usedByNet.has(t.netKey)) usedByNet.set(t.netKey, new Set())
      usedByNet.get(t.netKey)!.add(t.id)
    }
  }

  for (const t of pendingTraces) {
    if (t.id) continue
    // Determine netKey if missing by deriving from endpoints via connectivity map
    if (!t.netKey && t.endpoints) t.netKey = getNetKeyForEndpoints(t.endpoints)

    if (t.netKey) {
      const pool = tracesByNet.get(t.netKey) || []
      if (pool.length > 0) {
        const used = usedByNet.get(t.netKey) || new Set<string>()
        const chosen = pool.find((id) => !used.has(id)) || pool[0]
        t.id = chosen
        if (!usedByNet.has(t.netKey)) usedByNet.set(t.netKey, new Set())
        usedByNet.get(t.netKey)!.add(chosen)
      }
    }

    // Final fallback to solver id if still unresolved
    if (!t.id) {
      t.id = t.solverId || "solver_unknown"
    }
  }

  // Compute crossings and junctions without relying on DB lookups
  const withCrossings = computeCrossings(
    pendingTraces.map((t) => ({ id: t.id!, edges: t.edges })),
  )
  const junctionsById = computeJunctions(withCrossings)

  for (const t of withCrossings) {
    db.schematic_trace.insert({
      source_trace_id: t.id,
      edges: t.edges,
      junctions: junctionsById[t.id] ?? [],
    })
  }
}
