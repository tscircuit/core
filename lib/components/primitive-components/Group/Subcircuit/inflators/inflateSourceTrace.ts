import type { PcbPort, SourcePort, SourceTrace } from "circuit-json"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { InflatorContext } from "../InflatorFn"
import type { Port } from "lib/components"

export function inflateSourceTrace(
  sourceTrace: SourceTrace,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit } = inflatorContext

  const pcbTraces = injectionDb.pcb_trace.list({
    source_trace_id: sourceTrace.source_trace_id,
  })

  // TODO support multiple pcb traces with pcbPaths

  const pcbTrace = pcbTraces[0]

  if (!pcbTrace) {
    throw new Error(
      `No pcb trace found for source trace ${sourceTrace.source_trace_id}`,
    )
  }

  const inflationDbPcbPorts = pcbTrace.route
    .flatMap((rp) =>
      rp.route_type === "wire"
        ? [rp.start_pcb_port_id, rp.end_pcb_port_id]
        : [],
    )
    .filter(Boolean)
    .map((pcbPortId) => injectionDb.pcb_port.get(pcbPortId!) as PcbPort)

  debugger
  const connectedPorts: Port[] = []

  for (const pcbPort of inflationDbPcbPorts) {
    const sourcePort = injectionDb.source_port.get(pcbPort.source_port_id!)!
    const pinNumber = sourcePort.pin_number

    const component = injectionDb.source_component.get(
      sourcePort.source_component_id!,
    )!

    const connectedPort = subcircuit.selectOne(
      `.${component.name} > port.pin${pinNumber}`,
    ) as Port | null

    if (!connectedPort) continue

    connectedPorts.push(connectedPort)
  }

  if (connectedPorts.length <= 2) {
    throw new Error(
      `Trace ${sourceTrace.source_trace_id} has less than 2 connected ports`,
    )
  }

  const trace = new Trace({
    // path: ["#PortId1", "#PortId2"],
    path: connectedPorts.map((p) => p.getPortSelector()),
    pcbPath: pcbTrace.route.map((rp) =>
      rp.route_type === "wire"
        ? { x: rp.x, y: rp.y }
        : {
            x: rp.x,
            y: rp.y,
            // @ts-ignore
            layer: rp.to_layer,
          },
    ),
  })

  subcircuit.add(trace)
}
