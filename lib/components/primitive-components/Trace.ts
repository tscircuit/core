import { traceProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import { IJumpAutorouter, autoroute } from "@tscircuit/infgrid-ijump-astar"
import type { AnySoupElement, PCBTrace, SchematicTrace } from "@tscircuit/soup"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { computeObstacleBounds } from "lib/utils/autorouting/computeObstacleBounds"
import { projectPointInDirection } from "lib/utils/projectPointInDirection"
import type { TraceHint } from "./TraceHint"
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations"

export class Trace extends PrimitiveComponent<typeof traceProps> {
  source_trace_id: string | null = null
  pcb_trace_id: string | null = null
  schematic_trace_id: string | null = null

  get config() {
    return {
      zodProps: traceProps,
    }
  }

  getTracePortPathSelectors(): string[] {
    if ("from" in this.props && "to" in this.props) {
      return [
        typeof this.props.from === "string"
          ? this.props.from
          : this.props.from.getPortSelector(),
        typeof this.props.to === "string"
          ? this.props.to
          : this.props.to.getPortSelector(),
      ]
    }
    if ("path" in this.props) {
      return this.props.path.map((p) =>
        typeof p === "string" ? p : p.getPortSelector(),
      )
    }
    return []
  }

  _findConnectedPorts():
    | { allPortsFound: true; ports: Array<{ selector: string; port: Port }> }
    | { allPortsFound: false; ports?: undefined } {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const portSelectors = this.getTracePortPathSelectors()

    const ports = portSelectors.map((selector) => ({
      selector,
      port: parent.selectOne(selector, { type: "port" }) as Port,
    }))

    for (const { selector, port } of ports) {
      if (!port) {
        const parentSelector = selector.replace(/\>.*$/, "")
        const targetComponent = parent.selectOne(parentSelector)
        if (!targetComponent) {
          this.renderError(`Could not find port for selector "${selector}"`)
        } else {
          this.renderError(
            `Could not find port for selector "${selector}"\nsearched component ${targetComponent.getString()}, which has ports:${targetComponent.children
              .filter((c) => c.componentName === "Port")
              .map((c) => `  ${c.getString()}`)
              .join("\n")}`,
          )
        }
      }
    }

    if (ports.some((p) => !p.port)) {
      return { allPortsFound: false }
    }

    return { allPortsFound: true, ports }
  }

  doInitialSourceTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) {
      this.renderError("Trace has no parent")
      return
    }

    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound) return

    const trace = db.source_trace.insert({
      connected_source_port_ids: ports.map((p) => p.port.source_port_id!),
      connected_source_net_ids: [],
    })

    this.source_trace_id = trace.source_trace_id
  }

  doInitialPcbTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()

    if (!allPortsFound) return

    const pcbElements: AnySoupElement[] = db
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

    const source_trace = db.source_trace.get(this.source_trace_id!)!

    const hints = ports.flatMap(({ port }) =>
      port.matchedComponents.filter((c) => c.componentName === "TraceHint"),
    ) as TraceHint[]

    if (hints.length === 0) {
      const { solution } = autoroute(pcbElements.concat([source_trace]))
      // TODO for some reason, the solution gets duplicated inside ijump-astar
      const pcb_trace = solution[0]
      db.pcb_trace.insert(pcb_trace)
      this.pcb_trace_id = pcb_trace.pcb_trace_id
      return
    }

    if (ports.length > 2) {
      this.renderError(
        `Trace has more than two ports (${ports
          .map((p) => p.port.getString())
          .join(
            ", ",
          )}), routing between more than two ports for a single trace is not implemented`,
      )
      return
    }

    // When we have hints, we have to order the hints then route between each
    // terminal of the trace and the hints
    // TODO order based on proximity to ports
    const orderedHintsAndPorts: Array<TraceHint | Port> = [
      ports[0].port,
      ...hints,
      ports[1].port,
    ]

    const candidateLayerCombinations =
      findPossibleTraceLayerCombinations(orderedHintsAndPorts)
  }

  doInitialSchematicTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()

    if (!allPortsFound) return

    const obstacles: Obstacle[] = []
    const connection: SimpleRouteConnection = {
      name: this.source_trace_id!,
      pointsToConnect: [],
    }

    for (const elm of db.toArray()) {
      if (elm.type === "schematic_component") {
        obstacles.push({
          type: "rect",
          center: elm.center,
          width: elm.size.width,
          height: elm.size.height,
          connectedTo: [],
        })
      }
    }

    for (const { port } of ports) {
      connection.pointsToConnect.push(
        projectPointInDirection(
          port.getGlobalSchematicPosition(),
          port.facingDirection!,
          0.1501,
        ),
      )
    }

    const bounds = computeObstacleBounds(obstacles)

    const simpleRouteJsonInput: SimpleRouteJson = {
      obstacles,
      connections: [connection],
      bounds,
      layerCount: 1,
    }

    const autorouter = new IJumpAutorouter({
      input: simpleRouteJsonInput,
    })
    const results = autorouter.solve()

    if (results.length === 0) return

    const [result] = results

    if (!result.solved) return

    const { route } = result

    const edges: SchematicTrace["edges"] = []

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i]
      const to = route[i + 1]

      edges.push({
        from,
        to,
        // TODO to_schematic_port_id and from_schematic_port_id
      })
    }

    const trace = db.schematic_trace.insert({
      source_trace_id: this.source_trace_id!,

      edges,
    })

    this.schematic_trace_id = trace.schematic_trace_id
  }
}
