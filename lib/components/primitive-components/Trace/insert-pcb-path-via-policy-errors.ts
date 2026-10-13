import type { PcbPath } from "@tscircuit/props"
import type { PcbTrace, PcbVia } from "circuit-json"
import type { Port } from "../Port"
import type { Trace } from "./Trace"

interface InsertPcbPathViaPolicyErrorsInput {
  trace: Trace
  pcbTrace: PcbTrace
  path: PcbPath
  ports: Port[]
  pathIndex?: number
}

/**
 * Report disabled blind/buried vias once per path without changing saved copper. Via
 * centers are points in right-handed board-world mm (+X right, +Y up).
 * Path indices are zero-based positions in the original TSX array.
 */
export const insertPcbPathViaPolicyErrors = ({
  trace,
  pcbTrace,
  path,
  ports,
  pathIndex,
}: InsertPcbPathViaPolicyErrorsInput): void => {
  const allowBlindAndBuriedVias = trace
    ._getBoard()
    ?.getInheritedProperty("allowBlindAndBuriedVias")
  if (allowBlindAndBuriedVias) {
    return
  }

  const { db } = trace.root!
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

  // Keep the original TSX entry indices, including selectors and wire points,
  // so the diagnostic identifies the exact via the user needs to edit.
  const viaPathEntryIndices: number[] = []
  for (const [pathEntryIndex, point] of path.entries()) {
    if (typeof point !== "string" && point.via) {
      viaPathEntryIndices.push(pathEntryIndex)
    }
  }

  const pcbVias = db.pcb_via.list({ pcb_trace_id: pcbTrace.pcb_trace_id })
  const viaDescriptions: string[] = []
  let firstDisallowedVia: PcbVia | undefined
  for (const [viaIndex, via] of pcbVias.entries()) {
    // Check the emitted copper span: reaching both outer layers makes this a
    // through via, which is permitted even when blind and buried vias are off.
    const reachesTop = via.layers.includes("top")
    const reachesBottom = via.layers.includes("bottom")
    if (reachesTop && reachesBottom) {
      continue
    }

    let viaKind = "buried"
    if (reachesTop || reachesBottom) {
      viaKind = "blind"
    }

    // PCB vias are inserted in the same occurrence order as path via entries.
    const pathEntryIndex = viaPathEntryIndices[viaIndex]!
    const pathEntry = `${pathName}[${pathEntryIndex}]`
    const boardX = Number(via.x.toFixed(4))
    const boardY = Number(via.y.toFixed(4))

    firstDisallowedVia ??= via
    viaDescriptions.push(
      `${pathEntry}: ${viaKind} via ` +
        `(fromLayer: "${via.from_layer}", toLayer: "${via.to_layer}") ` +
        `spanning [${via.layers.join(", ")}] at board (${boardX}, ${boardY}) mm`,
    )
  }

  if (!firstDisallowedVia) {
    return
  }

  let viaCountDescription = "1 disallowed via"
  if (viaDescriptions.length > 1) {
    viaCountDescription = `${viaDescriptions.length} disallowed vias`
  }

  // Preserve saved copper and report all violations together so fixing one
  // path requires reading only one diagnostic. Anchor it at the first bad via.
  db.pcb_trace_error.insert({
    error_type: "pcb_trace_error",
    source_trace_id: trace.source_trace_id!,
    pcb_trace_id: pcbTrace.pcb_trace_id,
    pcb_component_ids: [],
    pcb_port_ids: ports.map((port) => port.pcb_port_id!).filter(Boolean),
    subcircuit_id: pcbTrace.subcircuit_id,
    center: { x: firstDisallowedVia.x, y: firstDisallowedVia.y },
    is_fatal: false,
    message:
      `Disallowed vias in ${pathName} (${traceDescription}): ${viaCountDescription}. ` +
      `The board's effective allowBlindAndBuriedVias={false} permits only ` +
      `top-to-bottom through vias. To fix this path, reroute the affected ` +
      `transitions using through vias with fromLayer: "top", toLayer: "bottom" ` +
      `(or the reverse), adjusting the adjoining wire layers to match. ` +
      `If your board fabrication supports blind/buried vias, you can instead ` +
      `set allowBlindAndBuriedVias={true} on <board>. ` +
      `Saved copper has been preserved. Affected indices (zero-based): ${viaDescriptions.join("; ")}.`,
  })
}
