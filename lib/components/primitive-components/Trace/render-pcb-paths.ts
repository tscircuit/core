import type { PcbPath } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"
import { getViaDiameterDefaults } from "../../../utils/pcbStyle/getViaDiameterDefaults"
import type { Port } from "../Port"
import { getRouteForPcbPath } from "./get-route-for-pcb-path"
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
  const boardComponent = trace._getBoard()
  const board = boardComponent?.pcb_board_id
    ? db.pcb_board.get(boardComponent.pcb_board_id)
    : db.pcb_board.list()[0]

  for (const path of paths) {
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
        // Logical path transitions do not restrict a through-hole barrel.
        layers: getAutoroutedViaLayers({
          fromLayer,
          toLayer,
          layerCount: subcircuit._getSubcircuitLayerCount(),
          allowBlindAndBuriedVias: board?.allow_blind_and_buried_vias ?? false,
        }),
        from_layer: fromLayer,
        to_layer: toLayer,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        pcb_group_id: trace.getGroup()?.pcb_group_id ?? undefined,
        subcircuit_connectivity_map_key: connectivityMapKey,
      })
    }
    trace._insertErrorIfTraceIsOutsideBoard(route, ports)
  }
  trace._portsRoutedOnPcb = ports
}
