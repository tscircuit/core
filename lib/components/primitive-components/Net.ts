import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { z } from "zod"
import type { Port } from "./Port"
import { Trace } from "./Trace/Trace"
import { pairs } from "lib/utils/pairs"
import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import { autoroute } from "@tscircuit/infgrid-ijump-astar"

export const netProps = z.object({
  name: z.string().refine(
    (val) => !/[+-]/.test(val),
    (val) => ({
      message: `Net names cannot contain "+" or "-" (component "Net" received "${val}"). Try using underscores instead, e.g. VCC_P`,
    }),
  ),
  connectsTo: z.union([z.string(), z.array(z.string())]).optional(),
})

export class Net extends PrimitiveComponent<typeof netProps> {
  source_net_id?: string
  subcircuit_connectivity_map_key: string | null = null

  get config() {
    return {
      componentName: "Net",
      zodProps: netProps,
    }
  }

  getPortSelector() {
    return `net.${this.props.name}`
  }

  _resolveConnectsTo(): string[] | undefined {
    const { _parsedProps: props } = this

    const connectsTo = props.connectsTo

    if (Array.isArray(connectsTo)) {
      return connectsTo
    }

    if (typeof connectsTo === "string") {
      return [connectsTo]
    }

    return undefined
  }

  doInitialCreateTracesFromNetLabels(): void {
    const { _parsedProps: props } = this
    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return

    // TODO check if connection is already represented by a trace in the
    // subcircuit

    for (const connection of connectsTo) {
      this.add(
        new Trace({
          from: connection,
          to: `net.${props.name}`,
        }),
      )
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const isGround = props.name.startsWith("GND")
    const isPositiveVoltageSource = props.name.startsWith("V")

    const net = db.source_net.insert({
      name: props.name,
      member_source_group_ids: [],
      is_ground: isGround,
      is_power: isPositiveVoltageSource,
      // @ts-ignore
      is_positive_voltage_source: isPositiveVoltageSource,
    })

    this.source_net_id = net.source_net_id
  }

  doInitialSourceParentAttachment(): void {
    const subcircuit = this.getSubcircuit()
    if (!subcircuit) return
    const { db } = this.root!
    db.source_net.update(this.source_net_id!, {
      subcircuit_id: subcircuit.subcircuit_id!,
    })
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
   *
   * Sometimes this phase doesn't find any net islands if the autorouter did
   * a good job and connected the islands. In some sense this is a "backup"
   * routing phase for autorouters that don't care about connecting nets.
   *
   * This should only run if the autorouter is sequential-trace
   */
  doInitialPcbRouteNetIslands(): void {
    if (this.root?.pcbDisabled) return
    if (this.getSubcircuit()._parsedProps.routingDisabled) return
    if (
      this.getSubcircuit()._getAutorouterConfig().groupMode !==
      "sequential-trace"
    )
      return

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
        this.renderError({
          pcb_trace_error_id: "",
          pcb_trace_id: "__net_trace_tmp",
          pcb_component_ids: [
            Aport.pcb_component_id!,
            Bport.pcb_component_id!,
          ].filter(Boolean),
          pcb_port_ids: [Aport.pcb_port_id!, Bport.pcb_port_id!].filter(
            Boolean,
          ),
          type: "pcb_trace_error",
          error_type: "pcb_trace_error",
          message: `Failed to route net islands for "${this.getString()}"`,
          source_trace_id: "__net_trace_tmp",
        })
        return
      }

      db.pcb_trace.insert(trace as any)
    }
  }

  renderError(
    message: Parameters<typeof PrimitiveComponent.prototype.renderError>[0],
  ) {
    if (typeof message === "string") {
      return super.renderError(message)
    }
    // TODO this needs to be cleaned up at some point!
    this.root?.db.pcb_trace_error.insert(message as any)
  }
}
