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
  const enclosedPaths = input.connections.filter(path => path.source_trace_id && path.pointsToConnect.length===2).flatMap(path=>{
    const net=input.connections.find(net=>!net.source_trace_id&&net.pointsToConnect.length>2&&path.pointsToConnect.every(point=>point.pcb_port_id&&net.pointsToConnect.some(other=>other.pcb_port_id===point.pcb_port_id)))
    if(!net||input.buses?.some(bus=>bus.connectionNames.includes(net.name)))return[]
    return[{path,net}]
  })
  const uniquePaths = enclosedPaths.filter(({net})=>enclosedPaths.filter(other=>other.net===net).length===1)
  const connections=input.connections.filter(connection=>!uniquePaths.some(({net})=>net===connection)).map(connection=>{
    const enclosing=uniquePaths.find(({path})=>path===connection)?.net
    if(!enclosing)return connection
    const pointsToConnect=[...connection.pointsToConnect]
    for(const point of enclosing.pointsToConnect){
      if(pointsToConnect.some(other=>point.pcb_port_id&&other.pcb_port_id===point.pcb_port_id))continue
      pointsToConnect.push(point)
    }
    return{...connection,pointsToConnect}
  })
  if(input.connections.length<=4)console.log("COALESCED_REQUEST="+JSON.stringify({before:input.connections.length,after:connections.length,enclosed:enclosedPaths.length,sourceConnections:input.connections.filter(c=>!!c.source_trace_id).length,netMetadata:input.connections.filter(c=>!!c.netConnectionName).length}))
  const routingInput = { ...input, connections, traces }
  return {
    ...routingInput,
    buses: input.buses?.flatMap((bus) =>
      getBusLanesLengthMatchingBuses(bus, routingInput),
    ),
  }
}
