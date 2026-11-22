import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

/** Preserve each bus's layer domain and the endpoint order of its actual copper. */
export const getBusLanesOutputTraces = ({
  input,
  traces,
}: {
  input: SimpleRouteJson
  traces: SimplifiedPcbTrace[]
}): SimplifiedPcbTrace[] => {
  return traces.map((trace) => {
    const connection = input.connections.find(
      (candidate) => candidate.name === trace.connection_name,
    )
    const start = trace.route.find((point) => point.route_type === "wire")
    if (!connection || connection.pointsToConnect.length !== 2 || !start) {
      return trace
    }

    const endpoints = [...connection.pointsToConnect].sort(
      (left, right) =>
        Math.hypot(left.x - start.x, left.y - start.y) -
        Math.hypot(right.x - start.x, right.y - start.y),
    )
    const connectsTo = endpoints.flatMap((point) => {
      if (point.pcb_port_id) return [point.pcb_port_id]
      return []
    })
    let allowedLayers = trace.allowedLayers
    for (const bus of input.buses ?? []) {
      const busAllowedLayers = bus.allowedLayers
      if (!bus.connectionNames.includes(connection.name) || !busAllowedLayers) {
        continue
      }
      if (!allowedLayers) {
        allowedLayers = [...busAllowedLayers]
        continue
      }
      allowedLayers = allowedLayers.filter((layer) =>
        busAllowedLayers.includes(layer),
      )
    }

    return {
      ...trace,
      allowedLayers,
      connectsTo: trace.connectsTo ?? connectsTo,
    }
  })
}
