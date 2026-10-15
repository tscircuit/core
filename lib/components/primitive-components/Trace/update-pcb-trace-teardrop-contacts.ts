import type { PcbTrace, SourceTrace } from "circuit-json"
import {
  type TraceTeardropContact,
  addTraceTeardrops,
} from "lib/utils/autorouting/add-trace-teardrops"
import { getSavedTraceViaContactWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import type { Trace } from "./Trace"

type PcbTraceId = PcbTrace["pcb_trace_id"]
type SourceTraceId = SourceTrace["source_trace_id"]
type TeardropRenderRoot = NonNullable<Trace["root"]>

interface PcbTraceTeardropRenderState {
  originalRoute: PcbTrace["route"]
  generatedRoute: PcbTrace["route"]
  contactsBySourceTraceId: Map<SourceTraceId, TraceTeardropContact[]>
}

const pcbTraceTeardropRenderStateByRoot = new WeakMap<
  TeardropRenderRoot,
  Map<PcbTraceId, PcbTraceTeardropRenderState>
>()

function getRoutePointGeometryJson(
  routePoint: PcbTrace["route"][number],
): string {
  const { is_inside_copper_pour, copper_pour_id, ...rest } =
    routePoint as typeof routePoint & {
      is_inside_copper_pour?: boolean
      copper_pour_id?: string
    }
  return JSON.stringify(rest)
}

function hasSameGeneratedGeometry(
  currentRoute: PcbTrace["route"],
  generatedRoute: PcbTrace["route"],
): boolean {
  if (currentRoute === generatedRoute) return true
  if (currentRoute.length !== generatedRoute.length) return false
  // Copper-pour annotation can clone points after this phase without changing
  // copper. Ignore only those annotations when recognizing our prior output.
  return currentRoute.every(
    (routePoint, routePointIndex) =>
      getRoutePointGeometryJson(routePoint) ===
      getRoutePointGeometryJson(generatedRoute[routePointIndex]),
  )
}

function getPcbTraceTeardropRenderStateByPcbTraceId(
  root: TeardropRenderRoot,
): Map<PcbTraceId, PcbTraceTeardropRenderState> {
  const existingState = pcbTraceTeardropRenderStateByRoot.get(root)
  if (existingState) return existingState

  const createdState = new Map<PcbTraceId, PcbTraceTeardropRenderState>()
  pcbTraceTeardropRenderStateByRoot.set(root, createdState)
  return createdState
}

function refreshPcbTraceTeardropBaseline({
  pcbTrace,
  pcbTraceTeardropRenderState,
}: {
  pcbTrace: PcbTrace
  pcbTraceTeardropRenderState: PcbTraceTeardropRenderState
}): boolean {
  if (
    hasSameGeneratedGeometry(
      pcbTrace.route,
      pcbTraceTeardropRenderState.generatedRoute,
    )
  ) {
    return false
  }

  pcbTraceTeardropRenderState.originalRoute = pcbTrace.route
  pcbTraceTeardropRenderState.generatedRoute = pcbTrace.route
  return true
}

function getRouteWithExplicitViaContacts({
  route,
  contacts,
}: {
  route: PcbTrace["route"]
  contacts: TraceTeardropContact[]
}): PcbTrace["route"] {
  return route.flatMap((routePoint, routePointIndex): PcbTrace["route"] => {
    if (
      routePoint.route_type !== "via" ||
      !contacts.some(
        (contact) =>
          Math.hypot(contact.x - routePoint.x, contact.y - routePoint.y) < 1e-6,
      )
    ) {
      return [routePoint]
    }

    const { fromWidth, toWidth } = getSavedTraceViaContactWidths(
      route,
      routePointIndex,
      0,
    )
    if (!fromWidth || !toWidth) return [routePoint]

    const previousRoutePoint = route[routePointIndex - 1]
    const nextRoutePoint = route[routePointIndex + 1]
    const explicitViaContactRoute: PcbTrace["route"] = []
    if (
      !(
        previousRoutePoint?.route_type === "wire" &&
        previousRoutePoint.x === routePoint.x &&
        previousRoutePoint.y === routePoint.y &&
        previousRoutePoint.layer === routePoint.from_layer
      )
    ) {
      explicitViaContactRoute.push({
        route_type: "wire",
        x: routePoint.x,
        y: routePoint.y,
        width: fromWidth,
        layer: routePoint.from_layer,
      })
    }
    explicitViaContactRoute.push(routePoint)
    if (
      !(
        nextRoutePoint?.route_type === "wire" &&
        nextRoutePoint.x === routePoint.x &&
        nextRoutePoint.y === routePoint.y &&
        nextRoutePoint.layer === routePoint.to_layer
      )
    ) {
      explicitViaContactRoute.push({
        route_type: "wire",
        x: routePoint.x,
        y: routePoint.y,
        width: toWidth,
        layer: routePoint.to_layer,
      })
    }
    return explicitViaContactRoute
  })
}

function renderPcbTraceTeardrops({
  root,
  pcbTraceId,
  pcbTraceTeardropRenderStateByPcbTraceId,
}: {
  root: TeardropRenderRoot
  pcbTraceId: PcbTraceId
  pcbTraceTeardropRenderStateByPcbTraceId: Map<
    PcbTraceId,
    PcbTraceTeardropRenderState
  >
}): void {
  const pcbTraceTeardropRenderState =
    pcbTraceTeardropRenderStateByPcbTraceId.get(pcbTraceId)
  if (!pcbTraceTeardropRenderState) return

  const pcbTrace = root.db.pcb_trace.get(pcbTraceId)
  if (!pcbTrace) {
    pcbTraceTeardropRenderStateByPcbTraceId.delete(pcbTraceId)
    return
  }
  refreshPcbTraceTeardropBaseline({
    pcbTrace,
    pcbTraceTeardropRenderState,
  })

  const contacts = [
    ...pcbTraceTeardropRenderState.contactsBySourceTraceId.values(),
  ].flat()
  const routeWithExplicitViaContacts = getRouteWithExplicitViaContacts({
    route: pcbTraceTeardropRenderState.originalRoute,
    contacts,
  })
  const generatedRoute = addTraceTeardrops(
    routeWithExplicitViaContacts,
    contacts,
  )
  root.db.pcb_trace.update(pcbTraceId, { route: generatedRoute })

  if (contacts.length === 0) {
    pcbTraceTeardropRenderStateByPcbTraceId.delete(pcbTraceId)
    return
  }
  pcbTraceTeardropRenderState.generatedRoute = generatedRoute
}

export function updatePcbTraceTeardropContacts({
  root,
  sourceTraceId,
  contactsByPcbTraceId,
}: {
  root: TeardropRenderRoot
  sourceTraceId: SourceTraceId
  contactsByPcbTraceId: Map<PcbTraceId, TraceTeardropContact[]>
}): void {
  const pcbTraceTeardropRenderStateByPcbTraceId =
    getPcbTraceTeardropRenderStateByPcbTraceId(root)
  const affectedPcbTraceIds = new Set<PcbTraceId>()

  for (const [
    pcbTraceId,
    pcbTraceTeardropRenderState,
  ] of pcbTraceTeardropRenderStateByPcbTraceId) {
    const pcbTrace = root.db.pcb_trace.get(pcbTraceId)
    if (!pcbTrace) {
      pcbTraceTeardropRenderStateByPcbTraceId.delete(pcbTraceId)
      continue
    }
    if (
      refreshPcbTraceTeardropBaseline({
        pcbTrace,
        pcbTraceTeardropRenderState,
      })
    ) {
      affectedPcbTraceIds.add(pcbTraceId)
    }
    if (
      pcbTraceTeardropRenderState.contactsBySourceTraceId.delete(sourceTraceId)
    ) {
      affectedPcbTraceIds.add(pcbTraceId)
    }
  }

  for (const [pcbTraceId, contacts] of contactsByPcbTraceId) {
    const pcbTrace = root.db.pcb_trace.get(pcbTraceId)
    if (!pcbTrace || contacts.length === 0) continue

    let pcbTraceTeardropRenderState =
      pcbTraceTeardropRenderStateByPcbTraceId.get(pcbTraceId)
    if (!pcbTraceTeardropRenderState) {
      pcbTraceTeardropRenderState = {
        originalRoute: pcbTrace.route,
        generatedRoute: pcbTrace.route,
        contactsBySourceTraceId: new Map<
          SourceTraceId,
          TraceTeardropContact[]
        >(),
      }
      pcbTraceTeardropRenderStateByPcbTraceId.set(
        pcbTraceId,
        pcbTraceTeardropRenderState,
      )
    } else {
      refreshPcbTraceTeardropBaseline({
        pcbTrace,
        pcbTraceTeardropRenderState,
      })
    }
    pcbTraceTeardropRenderState.contactsBySourceTraceId.set(
      sourceTraceId,
      contacts,
    )
    affectedPcbTraceIds.add(pcbTraceId)
  }

  for (const pcbTraceId of affectedPcbTraceIds) {
    renderPcbTraceTeardrops({
      root,
      pcbTraceId,
      pcbTraceTeardropRenderStateByPcbTraceId,
    })
  }
}
