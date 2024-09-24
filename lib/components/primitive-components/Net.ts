import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import type { Port } from "./Port"
import type { Trace } from "./Trace"
import { pairs } from "lib/utils/pairs"
import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import { autoroute } from "@tscircuit/infgrid-ijump-astar"

export const netProps = z.object({
  name: z.string(),
})

export class Net extends PrimitiveComponent<typeof netProps> {
  source_net_id?: string

  getPortSelector() {
    return `net.${this.props.name}`
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const net = db.source_net.insert({
      name: props.name,
      member_source_group_ids: [],
    })

    this.source_net_id = net.source_net_id
  }

  /**
   * Get all ports connected to this net.
   *
   * TODO currently we're not checking for indirect connections (traces that are
   * connected to other traces that are in turn connected to the net)
   */
  getAllConnectedPorts(): Port[] {
    const allPorts = this.getSubcircuit().selectAll("port") as Port[]
    const connectedPorts: Port[] = []

    for (const port of allPorts) {
      const traces = port._getDirectlyConnectedTraces()

      for (const trace of traces) {
        if (trace._isExplicitlyConnectedToNet(this)) {
          connectedPorts.push(port)
          break
        }
      }
    }

    return connectedPorts
  }

  /**
   * Get all traces that are directly connected to this net, i.e. they list
   * this net in their path, from, or to props
   */
  _getAllDirectlyConnectedTraces(): Trace[] {
    const allTraces = this.getSubcircuit().selectAll("trace") as Trace[]
    const connectedTraces: Trace[] = []

    for (const trace of allTraces) {
      if (trace._isExplicitlyConnectedToNet(this)) {
        connectedTraces.push(trace)
      }
    }

    return connectedTraces
  }

  /**
   * Add PCB Traces to connect net islands together. A net island is a set of
   * ports that are connected to each other. If a there are multiple net islands
   * that means that the net is not fully connected and we need to add traces
   * such that the nets are fully connected
   */
  doInitialPcbRouteNetIslands(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const traces = this._getAllDirectlyConnectedTraces().filter(
      (trace) => (trace._portsRoutedOnPcb?.length ?? 0) > 0,
    )

    const islands: Array<{ ports: Port[]; traces: Trace[] }> = []

    for (const trace of traces) {
      const tracePorts = trace._portsRoutedOnPcb
      const traceIsland = islands.find((island) =>
        tracePorts.some((port) => island.ports.includes(port)),
      )
      if (!traceIsland) {
        islands.push({ ports: [...tracePorts], traces: [trace] })
        continue
      }
      traceIsland.traces.push(trace)
      traceIsland.ports.push(...tracePorts)
    }

    if (islands.length === 0) {
      return
    }

    // Connect islands together by looking at each pair of islands and adding
    // a trace between them
    const islandPairs = pairs(islands)
    for (const [A, B] of islandPairs) {
      // Find two closest ports on the island
      const Apositions: Array<{ x: number; y: number }> = A.ports.map((port) =>
        port._getGlobalPcbPositionBeforeLayout(),
      )
      const Bpositions: Array<{ x: number; y: number }> = B.ports.map((port) =>
        port._getGlobalPcbPositionBeforeLayout(),
      )

      let closestDist = Infinity
      let closestPair: [number, number] = [-1, -1]
      for (let i = 0; i < Apositions.length; i++) {
        const Apos = Apositions[i]
        for (let j = 0; j < Bpositions.length; j++) {
          const Bpos = Bpositions[j]
          const dist = Math.sqrt(
            (Apos.x - Bpos.x) ** 2 + (Apos.y - Bpos.y) ** 2,
          )
          if (dist < closestDist) {
            closestDist = dist
            closestPair = [i, j]
          }
        }
      }

      const Aport = A.ports[closestPair[0]]
      const Bport = B.ports[closestPair[1]]

      const pcbElements: AnyCircuitElement[] = db
        .toArray()
        .filter(
          (elm) =>
            elm.type === "pcb_smtpad" ||
            elm.type === "pcb_trace" ||
            elm.type === "pcb_plated_hole" ||
            elm.type === "pcb_hole" ||
            elm.type === "source_port" ||
            elm.type === "pcb_port",
        )

      const { solution } = autoroute(
        pcbElements.concat([
          {
            type: "source_trace",
            source_trace_id: "__net_trace_tmp",
            connected_source_port_ids: [
              Aport.source_port_id!,
              Bport.source_port_id!,
            ],
          } as SourceTrace,
        ]) as any, // Remove as any when autorouting-dataset has been updated
      )

      const trace = solution[0]
      if (!trace) {
        this.renderError("Failed to route net islands")
        return
      }

      db.pcb_trace.insert(trace as any)
    }
  }
}
