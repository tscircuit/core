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
}) {
  const { group, solver, pinIdToSchematicPortId, pairKeyToSourceTraceId } = args
  const { db } = group.root!

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap
  const pendingTraces: Array<{ id: string; edges: SchematicTrace["edges"] }> =
    []

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
      }
    }

    if (!source_trace_id) {
      source_trace_id = `solver_${solved?.mspPairId!}`
    }

    pendingTraces.push({
      id: source_trace_id,
      edges,
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
    })
  }
}
