import type { PcbTrace, PcbSmtPad } from "circuit-json"
import {
  addTraceTeardrops,
  type TraceTeardropContact,
} from "lib/utils/autorouting/add-trace-teardrops"
import type { Trace } from "./Trace"
import { getSavedTraceViaContactWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"

// Pending release of @tscircuit/props PR #869. Read parsed input only.
interface TeardropOptions {
  pcbTeardrops?: boolean
  pcbTeardropStart?: boolean
  pcbTeardropEnd?: boolean
}

type TeardropRenderContext = Pick<
  Trace,
  | "root"
  | "source_trace_id"
  | "_findConnectedPorts"
  | "_getTracePortOrNetSelectorListFromProps"
> & {
  _parsedProps: Trace["_parsedProps"] & TeardropOptions
}

type PcbTraceId = PcbTrace["pcb_trace_id"]
const generatedRoutes = new WeakMap<
  TeardropRenderContext,
  Map<
    PcbTraceId,
    {
      original: PcbTrace["route"]
      generated: PcbTrace["route"]
    }
  >
>()

function hasSameGeneratedGeometry(
  current: PcbTrace["route"],
  generated: PcbTrace["route"],
): boolean {
  if (current === generated) return true
  if (current.length !== generated.length) return false
  // Copper-pour annotation can clone points after this phase without changing
  // copper. Ignore only those annotations when recognizing our prior output.
  const geometry = (point: PcbTrace["route"][number]) => {
    const { is_inside_copper_pour, copper_pour_id, ...rest } =
      point as typeof point & {
        is_inside_copper_pour?: boolean
        copper_pour_id?: string
      }
    return JSON.stringify(rest)
  }
  return current.every(
    (point, index) => geometry(point) === geometry(generated[index]),
  )
}

function getPadDiameter(pad: PcbSmtPad): number {
  if (pad.shape === "polygon") return 0
  if (pad.shape === "circle") return pad.radius * 2
  return Math.min(pad.width, pad.height)
}

export function Trace_doInitialPcbTraceTeardropRender(
  trace: TeardropRenderContext,
): void {
  if (!trace.root || trace.root.pcbDisabled || !trace.source_trace_id) return
  const { db } = trace.root
  const props = trace._parsedProps
  const previous = generatedRoutes.get(trace)
  // Restore our own output before reapplying changed options. Newly routed
  // geometry replaces the saved baseline, rather than restoring stale copper.
  for (const [id, routes] of previous ?? []) {
    const current = db.pcb_trace.get(id)
    if (current && hasSameGeneratedGeometry(current.route, routes.generated))
      db.pcb_trace.update(id, { route: routes.original })
  }
  generatedRoutes.delete(trace)
  if (!props.pcbTeardrops && !props.pcbTeardropStart && !props.pcbTeardropEnd)
    return
  const connected = trace._findConnectedPorts()
  if (!connected.allPortsFound) return
  const selectors = trace._getTracePortOrNetSelectorListFromProps()
  const enabledPorts = connected.portsWithSelectors.map(
    ({ port, selector }) => ({
      port,
      enabled:
        selector === selectors[0]
          ? (props.pcbTeardropStart ?? props.pcbTeardrops ?? false)
          : selector === selectors.at(-1)
            ? (props.pcbTeardropEnd ?? props.pcbTeardrops ?? false)
            : (props.pcbTeardrops ?? false),
    }),
  )
  const padContacts: TraceTeardropContact[] = []
  for (const { port, enabled } of enabledPorts) {
    if (!enabled || !port.pcb_port_id) continue
    for (const pad of db.pcb_smtpad.list({ pcb_port_id: port.pcb_port_id })) {
      if (pad.shape === "polygon") continue
      padContacts.push({
        x: pad.x,
        y: pad.y,
        layer: pad.layer,
        diameter: getPadDiameter(pad),
      })
    }
    for (const hole of db.pcb_plated_hole.list({
      pcb_port_id: port.pcb_port_id,
    })) {
      if (hole.shape !== "circle") continue
      for (const layer of hole.layers)
        padContacts.push({
          x: hole.x,
          y: hole.y,
          layer,
          diameter: hole.outer_diameter,
        })
    }
  }
  const outputs = new Map<
    PcbTraceId,
    { original: PcbTrace["route"]; generated: PcbTrace["route"] }
  >()
  for (const pcbTrace of db.pcb_trace.list({
    source_trace_id: trace.source_trace_id,
  })) {
    const contacts = [...padContacts]
    for (const via of db.pcb_via.list({
      pcb_trace_id: pcbTrace.pcb_trace_id,
    })) {
      const endpoint = enabledPorts.find(({ port }) => {
        const position = port._getGlobalPcbPositionAfterLayout()
        return Math.hypot(position.x - via.x, position.y - via.y) < 1e-6
      })
      if (!(endpoint ? endpoint.enabled : props.pcbTeardrops)) continue
      for (const layer of via.layers)
        contacts.push({
          x: via.x,
          y: via.y,
          layer,
          diameter: via.outer_diameter,
        })
    }
    // Via contacts make both incident wire segments explicit without moving
    // the via, so the same taper operation handles both copper layers.
    const wireContacts = pcbTrace.route.flatMap(
      (point, index): PcbTrace["route"] => {
        if (
          point.route_type !== "via" ||
          !contacts.some(
            (contact) =>
              Math.hypot(contact.x - point.x, contact.y - point.y) < 1e-6,
          )
        )
          return [point]
        const { fromWidth, toWidth } = getSavedTraceViaContactWidths(
          pcbTrace.route,
          index,
          0,
        )
        if (!fromWidth || !toWidth) return [point]
        const before = pcbTrace.route[index - 1]
        const after = pcbTrace.route[index + 1]
        const result: PcbTrace["route"] = []
        if (
          !(
            before?.route_type === "wire" &&
            before.x === point.x &&
            before.y === point.y &&
            before.layer === point.from_layer
          )
        )
          result.push({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: fromWidth,
            layer: point.from_layer,
          })
        result.push(point)
        if (
          !(
            after?.route_type === "wire" &&
            after.x === point.x &&
            after.y === point.y &&
            after.layer === point.to_layer
          )
        )
          result.push({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: toWidth,
            layer: point.to_layer,
          })
        return result
      },
    )
    const route = addTraceTeardrops(wireContacts, contacts)
    if (route.length === pcbTrace.route.length) continue
    outputs.set(pcbTrace.pcb_trace_id, {
      original: pcbTrace.route,
      generated: route,
    })
    db.pcb_trace.update(pcbTrace.pcb_trace_id, { route })
  }
  generatedRoutes.set(trace, outputs)
}
