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
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"

const debug = Debug("Group_doInitialSchematicTraceRender")

/**
 * Render all traces within this subcircuit
 */
export const Group_doInitialSchematicTraceRender = (group: Group<any>) => {
  if (!group.isSubcircuit) return
  if (group.root?.schematicDisabled) return

  const { db } = group.root!

  const traces = group.selectAll("trace")
  const displayLabelTraces = traces.filter((t: any) => t._parsedProps?.schDisplayLabel)
  const displayLabelSourceTraceIds = new Set(
    displayLabelTraces
      .map((t: any) => t.source_trace_id)
      .filter((id: any): id is string => Boolean(id)),
  )
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
    if (displayLabelSourceTraceIds.has(st.source_trace_id)) {
      continue
    }
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
  // Map raw connectivity ids (e.g. "connectivity_net7") to source_nets as well.
  // subcircuit_connectivity_map_key often includes a subcircuit prefix, but
  // solvers may emit just "connectivity_netX". Normalize for lookup.
  const normalizedConnKeyToNet = new Map<string, any>()
  for (const [key, net] of connKeyToNet) {
    const m = key.match(/connectivity_net\d+/)
    if (m) normalizedConnKeyToNet.set(m[0], net)
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

  // Build available net label orientations based on source net names:
  // - Nets with names starting with "V" (e.g. VCC, V5, V3_3, VIN) get only "y+"
  // - Net named exactly "GND" gets only "y-"
  const availableNetLabelOrientations: Record<
    string,
    Array<"x+" | "x-" | "y+" | "y-">
  > = (() => {
    const map: Record<string, Array<"x+" | "x-" | "y+" | "y-">> = {}
    const presentNetIds = new Set(netConnections.map((nc) => nc.netId))
    for (const net of db.source_net
      .list()
      .filter(
        (n) => !n.subcircuit_id || allowedSubcircuitIds.has(n.subcircuit_id),
      )) {
      if (!net.name) continue
      if (!presentNetIds.has(net.name)) continue
      if (net.name === "GND") {
        map[net.name] = ["y-"]
      } else if (/^V/.test(net.name)) {
        map[net.name] = ["y+"]
      }
    }
    return map
  })()

  const inputProblem: InputProblem = {
    chips,
    directConnections,
    netConnections,
    availableNetLabelOrientations,
    maxMspPairDistance: 2,
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
  const netLabelPlacements =
    solver.netLabelPlacementSolver?.netLabelPlacements ?? []
  for (const placement of netLabelPlacements as any[]) {
    const connKey =
      (placement as any).netId ??
      (placement as any).globalConnNetId ??
      (placement as any).dcConnNetId

    const anchor_position =
      (placement as any).anchorPoint ??
      (placement as any).anchor_position ??
      (placement as any).position

    const orientation = (placement as any).orientation as
      | "x+"
      | "x-"
      | "y+"
      | "y-"
      | undefined

    const anchor_side =
      orientation === "x+"
        ? "left"
        : orientation === "x-"
          ? "right"
          : orientation === "y+"
            ? "bottom"
            : orientation === "y-"
              ? "top"
              : "right"

    let sourceNet = connKey
      ? connKeyToNet.get(connKey) || normalizedConnKeyToNet.get(connKey)
      : undefined

    if (!sourceNet) {
      continue
    }

    let source_trace_id: string | undefined

    const text = sourceNet.name

    const center =
      (placement as any).center ??
      computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side: anchor_side as any,
        text,
      })

    db.schematic_net_label.insert({
      text,
      anchor_position,
      center,
      anchor_side: anchor_side as any,
      ...(sourceNet?.source_net_id
        ? { source_net_id: sourceNet.source_net_id }
        : {}),
      ...(source_trace_id ? { source_trace_id } : {}),
    })
  }

  // Insert net labels for traces that requested schDisplayLabel and were excluded from routing
  for (const trace of displayLabelTraces as any[]) {
    const label = trace._parsedProps?.schDisplayLabel
    if (!label) continue
    try {
      const res = trace._findConnectedPorts?.()
      if (!res?.allPortsFound || !res.ports || res.ports.length < 1) continue
      const ports = res.ports.slice(0, 2)
      for (const port of ports) {
        const anchor_position = port._getGlobalSchematicPositionAfterLayout()
        const side =
          getEnteringEdgeFromDirection(port.facingDirection || "right") || "right"
        const center = computeSchematicNetLabelCenter({
          anchor_position,
          anchor_side: side as any,
          text: label,
        })
        db.schematic_net_label.insert({
          text: label,
          anchor_position,
          center,
          anchor_side: side as any,
          ...(trace.source_trace_id ? { source_trace_id: trace.source_trace_id } : {}),
        })
      }
    } catch {}
  }

  // Create net labels for ports connected only to a net (no trace connected)
  for (const schPortId of Array.from(allSchematicPortIdsInScope)) {
    const sp = db.schematic_port.get(schPortId)
    if (!sp) continue
    if (sp.is_connected) continue

    const srcPortId = schPortIdToSourcePortId.get(schPortId)
    if (!srcPortId) continue
    const sourcePort = db.source_port.get(srcPortId)
    const key = sourcePort?.subcircuit_connectivity_map_key
    if (!key) continue

    const normalizedKeyMatch = key.match(/connectivity_net\d+/)
    const sourceNet =
      connKeyToNet.get(key) ||
      (normalizedKeyMatch ? normalizedConnKeyToNet.get(normalizedKeyMatch[0]) : undefined)

    if (!sourceNet) continue

    // Avoid duplicate labels at this port anchor position
    const existingAtPort = db.schematic_net_label
      .list()
      .some((nl) => {
        const samePos =
          Math.abs(nl.anchor_position.x - sp.center.x) < 1e-6 &&
          Math.abs(nl.anchor_position.y - sp.center.y) < 1e-6
        if (!samePos) return false
        if (sourceNet.source_net_id && nl.source_net_id) {
          return nl.source_net_id === sourceNet.source_net_id
        }
        return nl.text === (sourceNet.name || key)
      })
    if (existingAtPort) continue

    const text = sourceNet.name || sourceNet.source_net_id || key
    const side =
      getEnteringEdgeFromDirection(
        (sp.facing_direction as any) || "right",
      ) || "right"
    const center = computeSchematicNetLabelCenter({
      anchor_position: sp.center,
      anchor_side: side as any,
      text,
    })

    db.schematic_net_label.insert({
      text,
      anchor_position: sp.center,
      center,
      anchor_side: side as any,
      ...(sourceNet.source_net_id ? { source_net_id: sourceNet.source_net_id } : {}),
    })
  }
}
