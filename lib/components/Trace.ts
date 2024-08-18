import { traceProps } from "@tscircuit/props"
import { BaseComponent } from "./BaseComponent"

export class Trace extends BaseComponent<typeof traceProps> {
  get config() {
    return {
      zodProps: traceProps,
    }
  }

  doInitialPcbTraceRender(): void {
    const { db } = this.project!
    const { props } = this

    // db.pcb_port.getUsing({ source_port_id:

    // const pcb_trace = db.pcb_trace.insert({
    //   from: props.from.pcb_component_id,
    //   to: props.to.pcb_component_id,
    //   width: props.width,
    //   color: props.color,
    // })
  }
}
