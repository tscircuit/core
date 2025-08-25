import { Group } from "../Group"
import {
  SchematicTracePipelineSolver,
  type InputChip,
  type InputPin,
  type InputProblem,
} from "@tscircuit/schematic-trace-solver"
import Debug from "debug"
import type { SchematicTrace } from "circuit-json"
import { computeCrossings } from "./compute-crossings"
import { computeJunctions } from "./compute-junctions"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  const { db } = group.root!

  const traces = group.selectAll("trace")
  const childGroups = group.selectAll("group") as Group<any>[]

  const allSchematicGroupIds = [
    group.schematic_group_id,
    ...childGroups.map((a) => a.schematic_group_id),
  ]

  const schematicComponents = db.schematic_component
    .list()
    .filter((a) => allSchematicGroupIds.includes(a.schematic_group_id!))

  const chips: InputChip[] = []

  const pinIdToSchematicPortId = new Map<string, string>()
  const schematicPortIdToPinId = new Map<string, string>()

  for (const schematicComponent of schematicComponents) {
    const chipId = schematicComponent.schematic_component_id

    const pins: InputPin[] = []

    const sourceComponent = db.source_component.getWhere({
      source_component_id: schematicComponent.source_component_id,
    })

    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })

    for (const schematicPort of schematicPorts) {
      const pinId = `${sourceComponent?.name ?? schematicComponent.schematic_component_id}.${schematicPort.pin_number}`
      pinIdToSchematicPortId.set(pinId, schematicPort.schematic_port_id)
      schematicPortIdToPinId.set(schematicPort.schematic_port_id, pinId)
    }

    for (const schematicPort of schematicPorts) {
      const pinId = schematicPortIdToPinId.get(schematicPort.schematic_port_id)!

      pins.push({
        pinId,
        x: schematicPort.center.x,
        y: schematicPort.center.y,
      })
    }

    chips.push({
      chipId,
      center: schematicComponent.center,
      width: schematicComponent.size.width,
      height: schematicComponent.size.height,
      pins,
    })
  }

  // Build helpful maps for ports within this group (and nested groups)
  const allSchematicPortIdsInScope = new Set<string>()
  const schPortIdToSourcePortId = new Map<string, string>()
  const sourcePortIdToSchPortId = new Map<string, string>()
  for (const sc of schematicComponents) {
    const ports = db.schematic_port.list({
      schematic_component_id: sc.schematic_component_id,
    })
    for (const sp of ports) {
      allSchematicPortIdsInScope.add(sp.schematic_port_id)
      if (sp.source_port_id) {
        schPortIdToSourcePortId.set(sp.schematic_port_id, sp.source_port_id)
        sourcePortIdToSchPortId.set(sp.source_port_id, sp.schematic_port_id)
      }
    }
  }

  // Determine which subcircuits are in-scope (this group and its child groups)
  const allowedSubcircuitIds = new Set<string>()
  if (group.subcircuit_id) allowedSubcircuitIds.add(group.subcircuit_id)
  for (const cg of childGroups) {
    if (cg.subcircuit_id) allowedSubcircuitIds.add(cg.subcircuit_id)
  }

  // Compute directConnections from explicit source_traces
  const netIdToSourceTraceId = new Map<string, string>()
  const directConnections: Array<{ pinIds: [string, string]; netId?: string }> =
    []
  const pairKeyToSourceTraceId = new Map<string, string>()
  for (const st of db.source_trace.list()) {
    if (st.subcircuit_id && !allowedSubcircuitIds.has(st.subcircuit_id)) {
      continue
    }
    const connected = (st.connected_source_port_ids ?? [])
      .map((srcId: string) => sourcePortIdToSchPortId.get(srcId))
      .filter(
        (id): id is string => Boolean(id) && allSchematicPortIdsInScope.has(id),
      )

    if (connected.length >= 2) {
      // Only consider the first pair for a direct connection
      const [a, b] = connected.slice(0, 2)
      const pairKey = [a, b].sort().join("::")
      if (!pairKeyToSourceTraceId.has(pairKey)) {
        pairKeyToSourceTraceId.set(pairKey, st.source_trace_id)
        const netId = st.display_name ?? st.source_trace_id
        directConnections.push({
          pinIds: [a, b].map((id) => schematicPortIdToPinId.get(id)!) as [
            string,
            string,
          ],
          netId,
        })
        netIdToSourceTraceId.set(netId, st.source_trace_id)
      }
    }
  }

  // Compute netConnections from named nets (source_net) in-scope
  const netConnections: Array<{ netId: string; pinIds: string[] }> = []
  const connKeyToNet = new Map<string, any>()
  for (const net of db.source_net
    .list()
    .filter(
      (n) => !n.subcircuit_id || allowedSubcircuitIds.has(n.subcircuit_id),
    )) {
    if (net.subcircuit_connectivity_map_key) {
      connKeyToNet.set(net.subcircuit_connectivity_map_key, net)
    }
  }

  const connKeyToPinIds = new Map<string, string[]>()
  for (const [schId, srcPortId] of schPortIdToSourcePortId) {
    const sp = db.source_port.get(srcPortId)
    if (!sp?.subcircuit_connectivity_map_key) continue
    const key = sp.subcircuit_connectivity_map_key
    if (!connKeyToPinIds.has(key)) connKeyToPinIds.set(key, [])
    connKeyToPinIds.get(key)!.push(schId)
  }

  for (const [key, schematicPortIds] of connKeyToPinIds) {
    const net = connKeyToNet.get(key)
    if (net && schematicPortIds.length >= 2) {
      const netId = String(net.name || net.source_net_id || key)
      netConnections.push({
        netId,
        pinIds: schematicPortIds.map(
          (portId) => schematicPortIdToPinId.get(portId)!,
        ),
      })
    }
  }

  const inputProblem: InputProblem = {
    chips,
    directConnections,
    netConnections,
    availableNetLabelOrientations: {},
  }

  if (debug.enabled) {
    globalThis.debugOutputs?.add(
      "group-trace-render-input-problem",
      JSON.stringify(inputProblem, null, 2),
    )
  }

  const solver = new SchematicTracePipelineSolver(inputProblem)

  solver.solve()

  // Use the overlap-corrected traces from the pipeline
  const correctedMap = solver.traceOverlapShiftSolver?.correctedTraceMap ?? {}
  const pendingTraces: Array<{ id: string; edges: SchematicTrace["edges"] }> =
    []

  for (const solved of Object.values(correctedMap) as any[]) {
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

  // Place net labels
  console.log(solver.netLabelPlacementSolver!.netLabelPlacements)
}
