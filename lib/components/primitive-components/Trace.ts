import { traceProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import { IJumpAutorouter, autoroute } from "@tscircuit/infgrid-ijump-astar"
import type { AnySoupElement } from "@tscircuit/soup"
import type {
  Obstacle,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"

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

    const { solution } = autoroute(pcbElements.concat([source_trace]))

    // TODO for some reason, the solution gets duplicated. Seems to be an issue
    // with the ijump-astar function
    const pcb_trace = solution[0]

    db.pcb_trace.insert(pcb_trace)

    this.pcb_trace_id = pcb_trace.pcb_trace_id
  }

  doInitialSchematicTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()

    if (!allPortsFound) return

    // const schematicElements: AnySoupElement[] = db
    //   .toArray()
    //   .filter(
    //     (elm) =>
    //       elm.type === "schematic_component" ||
    //       elm.type === "schematic_line" ||
    //       elm.type === "schematic_path" ||
    //       elm.type === "schematic_text" ||
    //       elm.type === "schematic_port",
    //   )

    const obstacles: Obstacle[] = []

    const simpleRouteJsonInput: SimpleRouteJson = {
      obstacles,
      connections: [],
      bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
      layerCount: 1,
    }

    const autorouter = new IJumpAutorouter({
      input: simpleRouteJsonInput,
    })
    const results = autorouter.solve()

    for (const elm of db.toArray()) {
    }

    // const trace = db.schematic_trace.insert({
    //   source_trace_id: this.source_trace_id!,

    //   // edges:
    // })

    // this.schematic_trace_id = trace.schematic_trace_id
  }
}
