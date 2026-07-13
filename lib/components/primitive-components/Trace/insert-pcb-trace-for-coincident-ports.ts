import { jlcMinTolerances } from "@tscircuit/jlcpcb-manufacturing-specs"
import type { LayerRef } from "circuit-json"
import type { Trace } from "./Trace"

export const insertPcbTraceForCoincidentPorts = (trace: Trace): boolean => {
  const { db } = trace.root!

  let connectedPorts: ReturnType<Trace["_findConnectedPorts"]>
  try {
    connectedPorts = trace._findConnectedPorts()
  } catch {
    return false
  }

  if (!connectedPorts.allPortsFound || connectedPorts.ports.length !== 2) {
    return false
  }

  const [portA, portB] = connectedPorts.ports
  if (!portA.pcb_port_id || !portB.pcb_port_id) return false

  const pcbPortA = db.pcb_port.get(portA.pcb_port_id)
  const pcbPortB = db.pcb_port.get(portB.pcb_port_id)
  if (!pcbPortA || !pcbPortB) return false
  if (pcbPortA.x !== pcbPortB.x || pcbPortA.y !== pcbPortB.y) return false

  const layer = pcbPortA.layers.find((layer) => pcbPortB.layers.includes(layer))
  if (!layer) return false

  const width =
    trace._getExplicitTraceThickness() ??
    trace.getSubcircuit()._parsedProps.minTraceWidth ??
    jlcMinTolerances.min_trace_width!
  const pcbTrace = db.pcb_trace.insert({
    route: [
      {
        route_type: "wire",
        x: pcbPortA.x,
        y: pcbPortA.y,
        width,
        layer: layer as LayerRef,
        start_pcb_port_id: pcbPortA.pcb_port_id,
        end_pcb_port_id: pcbPortB.pcb_port_id,
      },
    ],
    source_trace_id: trace.source_trace_id!,
    subcircuit_id: trace.getSubcircuit().subcircuit_id!,
    pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
    trace_length: 0,
  })

  trace._portsRoutedOnPcb = connectedPorts.ports
  trace.pcb_trace_id = pcbTrace.pcb_trace_id
  return true
}
