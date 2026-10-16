import type { LayerRef, PcbTrace } from "circuit-json"
import type { Port } from "../Port"
import type { Trace } from "./Trace"

interface InsertPcbPathViaContactErrorsInput {
  trace: Trace
  pcbTrace: PcbTrace
  ports: Port[]
  pathIndex?: number
}

/**
 * Report barrel contact errors for board-world route points, in mm (+X right,
 * +Y up, right-handed). Error centers are points at the invalid vias. Preserve
 * the saved copper and associate each error with its rendered PCB trace.
 */
export const insertPcbPathViaContactErrors = ({
  trace,
  pcbTrace,
  ports,
  pathIndex,
}: InsertPcbPathViaContactErrorsInput): void => {
  const { db } = trace.root!
  const pcbVias = db.pcb_via.list({ pcb_trace_id: pcbTrace.pcb_trace_id })
  const connection = db.source_trace.get(trace.source_trace_id!)?.display_name

  let traceDescription = "unnamed trace"
  if (connection && trace._parsedProps.name) {
    traceDescription = `${trace.getDisplayName()}, ${connection}`
  } else if (connection) {
    traceDescription = connection
  } else if (trace._parsedProps.name) {
    traceDescription = trace.getDisplayName()
  }

  let pathName = "pcbPath"
  if (pathIndex !== undefined) {
    pathName = `pcbPaths[${pathIndex}]`
  }

  let incomingLayer: LayerRef | undefined
  let viaNumber = 0

  for (const point of pcbTrace.route) {
    if (point.route_type === "wire") {
      incomingLayer = point.layer
      continue
    }
    if (point.route_type !== "via") {
      continue
    }

    // Vias are inserted in route order, so only via points advance this number.
    viaNumber += 1
    const pcbVia = pcbVias[viaNumber - 1]!

    // Check the emitted via's physical copper span. A through via can contact
    // the incoming layer even when its logical from_layer differs.
    if (incomingLayer && !pcbVia.layers.includes(incomingLayer)) {
      const boardX = Number(point.x.toFixed(4))
      const boardY = Number(point.y.toFixed(4))

      // Keep the saved copper and vias visible so the user can inspect the
      // disconnected contact. The diagnostic must not stop rendering the path.
      db.pcb_trace_error.insert({
        error_type: "pcb_trace_error",
        source_trace_id: trace.source_trace_id!,
        message:
          `Invalid ${pathName} (${traceDescription}): ` +
          `via ${viaNumber} (${point.from_layer} → ${point.to_layer}) ` +
          `at board (${boardX}, ${boardY}) mm does not reach ` +
          `incoming ${incomingLayer} copper.`,
        center: { x: point.x, y: point.y },
        pcb_trace_id: pcbTrace.pcb_trace_id,
        pcb_component_ids: [],
        pcb_port_ids: ports.map((port) => port.pcb_port_id!).filter(Boolean),
        subcircuit_id: pcbTrace.subcircuit_id,
        is_fatal: false,
      })
    }

    // Continue along the saved route after an invalid contact so later
    // disconnected vias can also be reported.
    incomingLayer = point.to_layer
  }
}
