import { getBoundsFromPoints } from "@tscircuit/math-utils"
import {
  type CircuitJson,
  type PcbBoard,
  type PcbPort,
  type PcbTrace,
  type PcbTraceRoutePoint,
  type SourceComponentBase,
  type SourcePort,
  type SourceTrace,
} from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { inflateSourceTrace } from "./inflateSourceTrace"

type RoutePointWithPorts = PcbTraceRoutePoint & {
  start_pcb_port_id?: string
  end_pcb_port_id?: string
  pcb_port_id?: string
}

export const inflatePcbTrace = (
  pcbTrace: PcbTrace,
  inflatorContext: InflatorContext,
  circuitJson: CircuitJson,
) => {
  const { injectionDb, subcircuit } = inflatorContext
  const { db } = subcircuit.root!

  const sourcePorts = circuitJson.filter(
    (elm) => (elm as any).type === "source_port",
  ) as SourcePort[]
  const sourceComponents = circuitJson.filter(
    (elm) => (elm as any).type === "source_component",
  ) as SourceComponentBase[]
  const pcbPorts = circuitJson.filter(
    (elm) => (elm as any).type === "pcb_port",
  ) as PcbPort[]
  const sourcePortById = new Map(
    sourcePorts.map((port) => [port.source_port_id, port]),
  )
  const sourceComponentById = new Map(
    sourceComponents.map((comp) => [comp.source_component_id, comp]),
  )
  const pcbPortById = new Map(pcbPorts.map((port) => [port.pcb_port_id, port]))
  const pcbBoardFromCircuitJson = circuitJson.find(
    (elm): elm is PcbBoard => elm.type === "pcb_board",
  )

  // Prepare Trace components so downstream systems can find them
  const existingTraces =
    (subcircuit.getGroup()?.selectAll("trace") as
      | { source_trace_id: string | null }[]
      | undefined) ?? []
  const existingTraceIds = new Set(
    existingTraces
      .map((t) => t.source_trace_id)
      .filter((id): id is string => Boolean(id)),
  )
  const sourceTraces = circuitJson.filter(
    (elm) => (elm as any).type === "source_trace",
  ) as SourceTrace[]
  for (const sourceTrace of sourceTraces) {
    if (existingTraceIds.has((sourceTrace as any).source_trace_id)) continue
    inflateSourceTrace(sourceTrace, inflatorContext)
  }

  const targetPortKeyToId = new Map<string, string>()
  for (const port of db.pcb_port
    .list()
    .filter((p) => p.subcircuit_id === subcircuit.subcircuit_id)) {
    if (!port.source_port_id || !port.pcb_port_id) continue
    const sourcePort = db.source_port.get(port.source_port_id)
    const sourceComponent = sourcePort?.source_component_id
      ? db.source_component.get(sourcePort.source_component_id)
      : null
    const key = `${sourceComponent?.name ?? "__group"}|${
      sourcePort?.name ?? ""
    }`
    targetPortKeyToId.set(key, port.pcb_port_id)
  }

  const mapPortId = (originalPcbPortId: string | undefined) => {
    if (!originalPcbPortId) return undefined
    const originalPort = pcbPortById.get(originalPcbPortId)
    if (!originalPort?.source_port_id) return undefined
    const originalSourcePort = sourcePortById.get(originalPort.source_port_id)
    const originalSourceComponent = originalSourcePort?.source_component_id
      ? sourceComponentById.get(originalSourcePort.source_component_id)
      : null
    const key = `${originalSourceComponent?.name ?? "__group"}|${
      originalSourcePort?.name ?? ""
    }`
    return targetPortKeyToId.get(key)
  }

  // Compute centers for fallback translation
  const originalElementsCenter = (() => {
    const points: { x: number; y: number }[] = []
    for (const comp of injectionDb.pcb_component.list()) {
      if (comp.center) points.push(comp.center)
    }
    for (const port of injectionDb.pcb_port.list()) {
      if (port.x != null && port.y != null)
        points.push({ x: port.x, y: port.y })
    }
    if (points.length === 0) return undefined
    const bounds = getBoundsFromPoints(points)
    if (!bounds) return undefined
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }
  })()

  const targetGroupCenter = (() => {
    const group = subcircuit.getGroup()
    if (!group) return undefined
    if (group.pcb_group_id) {
      const pg = db.pcb_group.get(group.pcb_group_id)
      if (pg?.center) return pg.center
    }
    return group._getGlobalPcbPositionBeforeLayout()
  })()

  const originalGroupCenter = (() => {
    const firstPcbGroup = injectionDb.pcb_group.list()[0]
    if (firstPcbGroup?.center) return firstPcbGroup.center
    return undefined
  })()

  const getBoardCenter = (): { x: number; y: number } | undefined => {
    const boardId = subcircuit.getGroup()?._getBoard()?.pcb_board_id
    if (!boardId) return undefined
    const board = db.pcb_board.get(boardId)
    return board?.center
  }

  const computeRouteTranslation = (): { x: number; y: number } | undefined => {
    for (const point of circuitJson
      .filter((elm) => (elm as any).type === "pcb_trace")
      .flatMap((t) => (t as PcbTrace).route as RoutePointWithPorts[])) {
      const originalPortId =
        point.start_pcb_port_id || point.end_pcb_port_id || point.pcb_port_id
      const mappedPortId = mapPortId(originalPortId)
      if (!originalPortId || !mappedPortId) continue

      const originalPort = pcbPortById.get(originalPortId)
      const targetPort = db.pcb_port.get(mappedPortId)
      if (
        originalPort?.x != null &&
        originalPort?.y != null &&
        targetPort?.x != null &&
        targetPort?.y != null
      ) {
        return {
          x: targetPort.x - originalPort.x,
          y: targetPort.y - originalPort.y,
        }
      }
    }

    const originalCenter = originalGroupCenter ?? originalElementsCenter
    const targetCenter = pcbBoardFromCircuitJson
      ? getBoardCenter()
      : targetGroupCenter

    if (!originalCenter || !targetCenter) return undefined

    return {
      x: targetCenter.x - originalCenter.x,
      y: targetCenter.y - originalCenter.y,
    }
  }

  const translation = computeRouteTranslation()
  if (!translation) return

  const routePoints = pcbTrace.route as RoutePointWithPorts[]
  const translatedRoute = routePoints.map((point) => {
    const mappedStart = mapPortId(point.start_pcb_port_id)
    const mappedEnd = mapPortId(point.end_pcb_port_id)
    const mappedPcbPortId = mapPortId(point.pcb_port_id)
    return {
      ...point,
      x: point.x + translation.x,
      y: point.y + translation.y,
      ...(mappedStart ? { start_pcb_port_id: mappedStart } : {}),
      ...(mappedEnd ? { end_pcb_port_id: mappedEnd } : {}),
      ...(mappedPcbPortId ? { pcb_port_id: mappedPcbPortId } : {}),
    }
  })

  const translatedTrace: Omit<PcbTrace, "pcb_trace_id"> & {
    subcircuit_id: string
  } = {
    type: pcbTrace.type,
    route: translatedRoute,
    source_trace_id:
      pcbTrace.source_trace_id ??
      (pcbTrace as any).connection_name ??
      undefined,
    subcircuit_id: subcircuit.subcircuit_id!,
    pcb_group_id: subcircuit.getGroup()?.pcb_group_id ?? undefined,
  }

  db.pcb_trace.insert(translatedTrace)
}
