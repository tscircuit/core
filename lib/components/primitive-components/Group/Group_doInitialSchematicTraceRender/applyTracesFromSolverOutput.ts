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
}) {
  const {
    group,
    solver,
    pinIdToSchematicPortId,
    pairKeyToSourceTraceId,
    schPortIdToSourcePortId,
  } = args
  const { db } = group.root!

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap
  const pendingTraces: Array<{
    id: string
    edges: SchematicTrace["edges"]
    subcircuit_connectivity_map_key?: string
  }> = []

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

    // Try to associate with an existing source_trace_id when this is a direct connection
    let source_trace_id: string | null = null
    let subcircuit_connectivity_map_key: string | undefined
    if (Array.isArray(solved?.pins) && solved.pins.length === 2) {
      const pA = pinIdToSchematicPortId.get(solved.pins[0]?.pinId!)
      const pB = pinIdToSchematicPortId.get(solved.pins[1]?.pinId!)
      if (pA && pB) {
        const pairKey = [pA, pB].sort().join("::")
        source_trace_id =
          pairKeyToSourceTraceId.get(pairKey) ||
          `solver_${solved.mspPairId || pairKey}`

        // Mark ports as connected on schematic
        for (const schPid of [pA, pB]) {
          const existing = db.schematic_port.get(schPid)
          if (existing) db.schematic_port.update(schPid, { is_connected: true })
        }

        // Attempt to derive the connectivity key from the matched source_trace
        const source_trace = source_trace_id
          ? db.source_trace.get(source_trace_id)
          : undefined
        if (source_trace?.subcircuit_connectivity_map_key) {
          subcircuit_connectivity_map_key =
            source_trace.subcircuit_connectivity_map_key
        } else {
          // Fallback: infer from the connected ports' source_ports
          const src_A = pA ? schPortIdToSourcePortId.get(pA) : undefined
          const src_B = pB ? schPortIdToSourcePortId.get(pB) : undefined
          const source_port_A = src_A ? db.source_port.get(src_A) : undefined
          const source_port_B = src_B ? db.source_port.get(src_B) : undefined
          const subcircuit_connectivity_map_key_A = source_port_A?.subcircuit_connectivity_map_key
          const subcircuit_connectivity_map_key_B = source_port_B?.subcircuit_connectivity_map_key
          if (subcircuit_connectivity_map_key_A && subcircuit_connectivity_map_key_B && subcircuit_connectivity_map_key_A === subcircuit_connectivity_map_key_B) subcircuit_connectivity_map_key = subcircuit_connectivity_map_key_A
          else subcircuit_connectivity_map_key = subcircuit_connectivity_map_key_A || subcircuit_connectivity_map_key_B || undefined
        }
      }
    }

    if (!source_trace_id) {
      source_trace_id = `solver_${solved?.mspPairId!}`
    }

    pendingTraces.push({
      id: source_trace_id,
      edges,
      subcircuit_connectivity_map_key,
    })
  }

  // Compute crossings and junctions without relying on DB lookups
  const withCrossings = computeCrossings(
    pendingTraces.map((t) => ({ id: t.id, edges: t.edges })),
  )
  const junctionsById = computeJunctions(withCrossings)

  for (const t of withCrossings) {
    db.schematic_trace.insert({
      source_trace_id: t.id,
      edges: t.edges,
      junctions: junctionsById[t.id] ?? [],
      subcircuit_connectivity_map_key: pendingTraces.find((p) => p.id === t.id)
        ?.subcircuit_connectivity_map_key,
    })
  }
}
