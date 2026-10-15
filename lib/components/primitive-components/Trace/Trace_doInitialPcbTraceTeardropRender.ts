import type { PcbSmtPad, PcbTrace, SourceTrace } from "circuit-json"
import type { TraceTeardropContact } from "lib/utils/autorouting/add-trace-teardrops"
import type { Trace } from "./Trace"
import { updatePcbTraceTeardropContacts } from "./update-pcb-trace-teardrop-contacts"

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

type ConnectedPort = NonNullable<
  ReturnType<TeardropRenderContext["_findConnectedPorts"]>["portsWithSelectors"]
>[number]["port"]
type EnabledPort = { port: ConnectedPort; enabled: boolean }
type PcbTraceId = PcbTrace["pcb_trace_id"]
type SourceTraceId = SourceTrace["source_trace_id"]
type TeardropRenderRoot = NonNullable<TeardropRenderContext["root"]>

function getPadDiameter(pad: PcbSmtPad): number {
  if (pad.shape === "polygon") return 0
  if (pad.shape === "circle") return pad.radius * 2
  return Math.min(pad.width, pad.height)
}

function getConnectedPcbTraces({
  root,
  sourceTraceId,
}: {
  root: TeardropRenderRoot
  sourceTraceId: SourceTraceId
}): PcbTrace[] {
  const sourceTrace = root.db.source_trace.get(sourceTraceId)
  const connectivityMapKey = sourceTrace?.subcircuit_connectivity_map_key
  if (!connectivityMapKey) {
    return root.db.pcb_trace.list({ source_trace_id: sourceTraceId })
  }

  return root.db.pcb_trace.list().filter((pcbTrace) => {
    if (pcbTrace.source_trace_id === sourceTraceId) return true
    if (!pcbTrace.source_trace_id) return false
    const routedSourceTrace = root.db.source_trace.get(pcbTrace.source_trace_id)
    return (
      routedSourceTrace?.subcircuit_connectivity_map_key === connectivityMapKey
    )
  })
}

function getTeardropContacts({
  root,
  pcbTrace,
  enabledPorts,
  padContacts,
  enableUnmatchedVias,
}: {
  root: TeardropRenderRoot
  pcbTrace: PcbTrace
  enabledPorts: EnabledPort[]
  padContacts: TraceTeardropContact[]
  enableUnmatchedVias: boolean
}): TraceTeardropContact[] {
  const contacts = [...padContacts]
  for (const via of root.db.pcb_via.list({
    pcb_trace_id: pcbTrace.pcb_trace_id,
  })) {
    const endpoint = enabledPorts.find(({ port }) => {
      const position = port._getGlobalPcbPositionAfterLayout()
      return Math.hypot(position.x - via.x, position.y - via.y) < 1e-6
    })
    if (!(endpoint ? endpoint.enabled : enableUnmatchedVias)) continue
    for (const layer of via.layers) {
      contacts.push({
        x: via.x,
        y: via.y,
        layer,
        diameter: via.outer_diameter,
      })
    }
  }
  return contacts
}

function isTeardropEnabledForSelector({
  selector,
  selectors,
  props,
}: {
  selector: string
  selectors: string[]
  props: TeardropOptions
}): boolean {
  if (selector === selectors[0]) {
    return props.pcbTeardropStart ?? props.pcbTeardrops ?? false
  }
  if (selector === selectors.at(-1)) {
    return props.pcbTeardropEnd ?? props.pcbTeardrops ?? false
  }
  return props.pcbTeardrops ?? false
}

function getPadContacts({
  root,
  enabledPorts,
}: {
  root: TeardropRenderRoot
  enabledPorts: EnabledPort[]
}): TraceTeardropContact[] {
  const padContacts: TraceTeardropContact[] = []
  for (const { port, enabled } of enabledPorts) {
    if (!enabled || !port.pcb_port_id) continue
    for (const pad of root.db.pcb_smtpad.list({
      pcb_port_id: port.pcb_port_id,
    })) {
      if (pad.shape === "polygon") continue
      padContacts.push({
        x: pad.x,
        y: pad.y,
        layer: pad.layer,
        diameter: getPadDiameter(pad),
      })
    }
    for (const hole of root.db.pcb_plated_hole.list({
      pcb_port_id: port.pcb_port_id,
    })) {
      if (hole.shape !== "circle") continue
      for (const layer of hole.layers) {
        padContacts.push({
          x: hole.x,
          y: hole.y,
          layer,
          diameter: hole.outer_diameter,
        })
      }
    }
  }
  return padContacts
}

export function Trace_doInitialPcbTraceTeardropRender(
  trace: TeardropRenderContext,
): void {
  if (!trace.root || trace.root.pcbDisabled || !trace.source_trace_id) return
  const root = trace.root
  const sourceTraceId = trace.source_trace_id
  const props = trace._parsedProps
  const contactsByPcbTraceId = new Map<PcbTraceId, TraceTeardropContact[]>()
  const anyTeardropsEnabled = Boolean(
    props.pcbTeardrops || props.pcbTeardropStart || props.pcbTeardropEnd,
  )
  const connected = anyTeardropsEnabled
    ? trace._findConnectedPorts()
    : undefined

  if (connected?.allPortsFound) {
    const selectors = trace._getTracePortOrNetSelectorListFromProps()
    const enabledPorts = connected.portsWithSelectors.map(
      ({ port, selector }): EnabledPort => ({
        port,
        enabled: isTeardropEnabledForSelector({
          selector,
          selectors,
          props,
        }),
      }),
    )
    const padContacts = getPadContacts({ root, enabledPorts })

    for (const pcbTrace of getConnectedPcbTraces({
      root,
      sourceTraceId,
    })) {
      contactsByPcbTraceId.set(
        pcbTrace.pcb_trace_id,
        getTeardropContacts({
          root,
          pcbTrace,
          enabledPorts,
          padContacts,
          enableUnmatchedVias: props.pcbTeardrops ?? false,
        }),
      )
    }
  }

  updatePcbTraceTeardropContacts({
    root,
    sourceTraceId,
    contactsByPcbTraceId,
  })
}
