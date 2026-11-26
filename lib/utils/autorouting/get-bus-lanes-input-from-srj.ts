import { getBusLanesLengthMatchingBuses } from "./get-bus-lanes-length-matching-buses"
import type {
  SimpleRouteJson as BusLanesInput,
  Trace as BusLanesTrace,
} from "@tscircuit/bus-lanes-solver"
import type { SimpleRouteJson } from "./SimpleRouteJson"

/** Builds the bus solver's fixed-copper view in board-world millimetres
 * (+X right, +Y up). A through-obstacle passage already conducts between
 * layers through its supplied obstacle; it must not become a new drilled via.
 * Keep its planar projection on the entry layer and split at the layer change.
 * These fragments are input to the solver only, never replacement PCB traces.
 */
export function getBusLanesInputFromSrj(input: SimpleRouteJson): BusLanesInput {
  const traces: BusLanesTrace[] = []
  const occupiedTraceIds = new Set(
    input.traces?.map((trace) => trace.pcb_trace_id),
  )
  for (const trace of input.traces ?? []) {
    let route: BusLanesTrace["route"] = []
    let fragmentIndex = 0
    const flushFragment = (): void => {
      if (!route.length) return
      let pcbTraceId = trace.pcb_trace_id
      if (fragmentIndex > 0) {
        do {
          pcbTraceId = `${trace.pcb_trace_id}_bus_fragment_${fragmentIndex++}`
        } while (occupiedTraceIds.has(pcbTraceId))
      } else {
        fragmentIndex++
      }
      occupiedTraceIds.add(pcbTraceId)
      traces.push({ ...trace, pcb_trace_id: pcbTraceId, route })
      route = []
    }
    for (const segment of trace.route) {
      if (segment.route_type === "jumper") {
        throw new Error(
          "Bus lanes routing does not support supplied jumper copper",
        )
      }
      if (segment.route_type !== "through_obstacle") {
        route.push(segment)
        continue
      }
      route.push(
        {
          route_type: "wire",
          ...segment.start,
          layer: segment.from_layer,
          width: segment.width,
        },
        {
          route_type: "wire",
          ...segment.end,
          layer: segment.from_layer,
          width: segment.width,
        },
      )
      flushFragment()
      route.push({
        route_type: "wire",
        ...segment.end,
        layer: segment.to_layer,
        width: segment.width,
      })
    }
    flushFragment()
  }
  const netNamesWithOneNamedPath = new Set(
    input.connections.filter(connection => connection.netConnectionName && connection.pointsToConnect.length === 2 && input.connections.filter(other => other.netConnectionName === connection.netConnectionName).length === 1 && !input.buses?.some(bus=>bus.connectionNames.includes(connection.netConnectionName!))).map(connection=>connection.netConnectionName!),
  )
  const connections = input.connections.filter(connection=>!netNamesWithOneNamedPath.has(connection.name)).map(connection=>{
    if (!connection.netConnectionName || !netNamesWithOneNamedPath.has(connection.netConnectionName)) return connection
    const net = input.connections.find(net=>net.name===connection.netConnectionName)
    if (!net) return connection
    const pointsToConnect = [...connection.pointsToConnect]
    for (const point of net.pointsToConnect) {
      if (pointsToConnect.some(existing=>point.pcb_port_id && existing.pcb_port_id===point.pcb_port_id)) continue
      pointsToConnect.push(point)
    }
    return {...connection, pointsToConnect}
  })
  const routingInput = { ...input, connections, traces }
  return {
    ...routingInput,
    buses: input.buses?.flatMap((bus) =>
      getBusLanesLengthMatchingBuses(bus, routingInput),
    ),
  }
}
