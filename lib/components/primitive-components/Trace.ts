import { traceProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Trace extends PrimitiveComponent<typeof traceProps> {
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

  doInitialPcbTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const portSelectors = this.getTracePortPathSelectors()

    const ports = portSelectors.map((ps) => parent.selectOne(ps))

    console.log("ports", ports)

    // db.pcb_port.getUsing({ source_port_id:

    // const pcb_trace = db.pcb_trace.insert({
    //   from: props.from.pcb_component_id,
    //   to: props.to.pcb_component_id,
    //   width: props.width,
    //   color: props.color,
    // })
  }
}
