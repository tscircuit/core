import type { PcbPath } from "@tscircuit/props"
import type { LayerRef, PcbTrace } from "circuit-json"
import { getViaSpanLayers } from "lib/utils/getViaSpanLayers"
import { getViaDiameterDefaults } from "../../../utils/pcbStyle/getViaDiameterDefaults"
import type { Port } from "../Port"
import { getRouteForPcbPath } from "./get-route-for-pcb-path"
import { insertPcbPathViaContactErrors } from "./insert-pcb-path-via-contact-errors"
import type { Trace } from "./Trace"
import { getTraceLength } from "./trace-utils/compute-trace-length"

interface RenderPcbPathsInput {
  trace: Trace
  paths: PcbPath[]
  ports: Port[]
  portsWithSelectors: Array<{ selector: string; port: Port }>
  width: number
}

export const renderPcbPaths = ({
  trace,
  paths,
  ports,
  portsWithSelectors,
  width,
}: RenderPcbPathsInput): void => {
  const { db } = trace.root!
  const { pcbPathRelativeTo } = trace._parsedProps
  const subcircuit = trace.getSubcircuit()
  let anchorPort = pcbPathRelativeTo
    ? portsWithSelectors.find(({ selector }) => selector === pcbPathRelativeTo)
        ?.port
    : undefined
  if (!anchorPort && pcbPathRelativeTo) {
    anchorPort = subcircuit.selectOne(pcbPathRelativeTo, { type: "port" }) as
      | Port
      | undefined
  }
  anchorPort ??= ports[0]
  if (!anchorPort) {
    db.source_trace_not_connected_error.insert({
      error_type: "source_trace_not_connected_error",
      source_trace_id: trace.source_trace_id ?? undefined,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      message: "pcbPaths requires a connected port or pcbPathRelativeTo port",
    })
    return
  }

  const pcbStyle = trace.getInheritedMergedProperty("pcbStyle")
  const { holeDiameter, padDiameter } = getViaDiameterDefaults(pcbStyle)
  const connectivityMapKey =
    trace.subcircuit_connectivity_map_key ??
    db.source_trace.get(trace.source_trace_id!)?.subcircuit_connectivity_map_key

  for (const [pathIndex, path] of paths.entries()) {
    const route = getRouteForPcbPath({ trace, path, anchorPort, width })
    if (!route || route.length < 2) continue

    const pcbTrace = db.pcb_trace.insert({
      route,
      is_antenna_trace: trace.isAntennaTrace,
      source_trace_id: trace.source_trace_id!,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
      trace_length: getTraceLength(route),
    })
    trace.pcb_trace_id ??= pcbTrace.pcb_trace_id

    for (const point of route) {
      if (point.route_type !== "via") continue
      const fromLayer = point.from_layer as LayerRef
      const toLayer = point.to_layer as LayerRef
      db.pcb_via.insert({
        pcb_trace_id: pcbTrace.pcb_trace_id,
        x: point.x,
        y: point.y,
        hole_diameter: holeDiameter,
        outer_diameter: padDiameter,
        layers: getViaSpanLayers({
          fromLayer,
          toLayer,
          layerCount: subcircuit._getSubcircuitLayerCount(),
        }),
        from_layer: fromLayer,
        to_layer: toLayer,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
        subcircuit_connectivity_map_key: connectivityMapKey,
      })
    }
    insertPcbPathViaContactErrors({ trace, pcbTrace, ports, pathIndex })
    trace._insertErrorIfTraceIsOutsideBoard(route, ports)
    insertPcbPathViaPolicyErrors(trace, pcbTrace, path, ports, pathIndex)
  }
  trace._portsRoutedOnPcb = ports
}

/**
 * Report disabled blind/buried vias without changing the saved copper. Via
 * centers are points in right-handed board-world mm (+X right, +Y up).
 * Path entry indices refer directly to the original TSX array. PCB vias are
 * inserted in the same occurrence order as the path's via entries.
 */
export const insertPcbPathViaPolicyErrors = (
  trace: Trace,
  pcbTrace: PcbTrace,
  path: PcbPath,
  ports: Port[],
  pathIndex?: number,
): void => {
  const allowBlindAndBuriedVias = trace
    ._getBoard()
    ?.getInheritedProperty("allowBlindAndBuriedVias")
  if (allowBlindAndBuriedVias) return

  const { db } = trace.root!
  const connection = db.source_trace.get(trace.source_trace_id!)?.display_name
  const traceDescription = connection
    ? trace._parsedProps.name
      ? `${trace.getDisplayName()}, ${connection}`
      : connection
    : trace._parsedProps.name
      ? trace.getDisplayName()
      : "unnamed trace"
  const pathName =
    pathIndex === undefined ? "pcbPath" : `pcbPaths[${pathIndex}]`
  const viaEntries = Array.from(path.entries()).filter(
    ([, point]) => typeof point !== "string" && point.via,
  )
  const pcbVias = db.pcb_via.list({ pcb_trace_id: pcbTrace.pcb_trace_id })
  for (const [viaIndex, via] of pcbVias.entries()) {
    const reachesTop = via.layers.includes("top")
    const reachesBottom = via.layers.includes("bottom")
    if (reachesTop && reachesBottom) continue

    const viaKind = reachesTop || reachesBottom ? "blind" : "buried"
    const pathEntry = `${pathName}[${viaEntries[viaIndex]![0]}]`
    db.pcb_trace_error.insert({
      error_type: "pcb_trace_error",
      source_trace_id: trace.source_trace_id!,
      pcb_trace_id: pcbTrace.pcb_trace_id,
      pcb_component_ids: [],
      pcb_port_ids: ports.map((port) => port.pcb_port_id!).filter(Boolean),
      subcircuit_id: pcbTrace.subcircuit_id,
      center: { x: via.x, y: via.y },
      is_fatal: false,
      message: `Invalid ${pathEntry} (${traceDescription}): TSX via (resolved fromLayer: "${via.from_layer}", toLayer: "${via.to_layer}") creates a ${viaKind} via spanning [${via.layers.join(", ")}] at board (${Number(via.x.toFixed(4))}, ${Number(via.y.toFixed(4))}) mm, but the board's effective allowBlindAndBuriedVias={false} permits only top-to-bottom through vias. Use a top-to-bottom via span or set allowBlindAndBuriedVias={true}.`,
    })
  }
}
