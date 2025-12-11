import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { cju } from "@tscircuit/circuit-json-util"
import {
  type PcbBoard,
  type PcbPort,
  type PcbTrace,
  type PcbTraceRoutePoint,
  type PcbTraceRoutePointWire,
  type SourceComponentBase,
  type SourcePort,
} from "circuit-json"
import { type SubcircuitGroupProps } from "@tscircuit/props"
import type { Group } from "./Group"
import type { ZodType } from "zod"

type RoutePointWithPorts = PcbTraceRoutePoint & {
  start_pcb_port_id?: string
  end_pcb_port_id?: string
  pcb_port_id?: string
}

/**
 * Insert pcb_traces from circuitJson directly into the database.
 * This is used when circuitJson is provided to skip autorouting.
 */
export const Group_insertPcbTracesFromCircuitJson = <Props extends ZodType>(
  group: Group<Props>,
): void => {
  const { db } = group.root!
  const props = group._parsedProps as SubcircuitGroupProps
  const circuitJson = props.circuitJson
  if (!circuitJson) return
  const injectionDb = cju(circuitJson)

  // Build lookup tables from the injected circuitJson for mapping
  const sourcePortById = new Map(
    circuitJson
      .filter((elm): elm is SourcePort => elm.type === "source_port")
      .map((port) => [port.source_port_id, port]),
  )
  const sourceComponentById = new Map(
    circuitJson
      .filter(
        (elm): elm is SourceComponentBase => elm.type === "source_component",
      )
      .map((comp) => [comp.source_component_id, comp]),
  )
  const pcbPortById = new Map(
    circuitJson
      .filter((elm): elm is PcbPort => elm.type === "pcb_port")
      .map((port) => [port.pcb_port_id, port]),
  )
  const pcbBoardFromCircuitJson = circuitJson.find(
    (elm): elm is PcbBoard => elm.type === "pcb_board",
  )

  // Find the actual board center for this subcircuit (or undefined)
  const getBoardCenter = (): { x: number; y: number } | undefined => {
    const boardId = group._getBoard()?.pcb_board_id
    if (!boardId) return undefined
    const board = db.pcb_board.get(boardId)
    return board?.center
  }

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
    if (group.pcb_group_id) {
      const pg = db.pcb_group.get(group.pcb_group_id)
      if (pg?.center) return pg.center
    }
    return group._getGlobalPcbPositionBeforeLayout()
  })()

  const originalGroupCenter = (() => {
    const firstPcbGroup = injectionDb.pcb_group.list()[0]
    if (firstPcbGroup?.center) return firstPcbGroup.center
    return null
  })()

  // Map the current subcircuit's pcb_ports by component/port name so we
  // can reattach traces to the correct board instance.
  const targetPortKeyToId = new Map<string, string>()
  for (const port of db.pcb_port
    .list()
    .filter((p) => p.subcircuit_id === group.subcircuit_id)) {
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

  const mapPortId = (pcbPortId: string | undefined) => {
    if (!pcbPortId) return undefined
    const originalPort = pcbPortById.get(pcbPortId)
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

  // Translate routes similarly to how panels move boards, but prefer a precise
  // shift based on any mapped ports; fall back to center-based translation.
  const computeRouteTranslation = (): { x: number; y: number } | undefined => {
    for (const point of pcbTraces.flatMap(
      (t) => (t.route as RoutePointWithPorts[]) ?? [],
    )) {
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

  const pcbTraces = circuitJson.filter(
    (elm): elm is PcbTrace => elm.type === "pcb_trace",
  )
  if (pcbTraces.length === 0) return

  for (const pcbTrace of pcbTraces) {
    const routePoints = pcbTrace.route as RoutePointWithPorts[]
    const translation = computeRouteTranslation()
    if (!translation) continue
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

    // Clone the trace to avoid modifying the original
    const translatedTrace: Omit<PcbTrace, "pcb_trace_id"> & {
      subcircuit_id: string
    } = {
      type: pcbTrace.type,
      route: translatedRoute,
      source_trace_id: pcbTrace.source_trace_id,
      subcircuit_id: group.subcircuit_id!,
      pcb_group_id: group.pcb_group_id ?? undefined,
    }
    db.pcb_trace.insert(translatedTrace)
  }
}
