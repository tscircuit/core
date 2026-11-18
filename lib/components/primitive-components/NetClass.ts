import { netClassProps } from "@tscircuit/props"
import type { SourceNetClass } from "circuit-json"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** Named PCB trace-width rules, scoped to the containing subcircuit. */
export class NetClass extends PrimitiveComponent<typeof netClassProps> {
  source_net_class_id?: SourceNetClass["source_net_class_id"]

  get config() {
    return { componentName: "NetClass", zodProps: netClassProps }
  }

  doInitialCreateNetsFromProps(): void {
    createNetsFromProps(this, this._parsedProps.nets)
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const subcircuit_id = this.getSubcircuit().subcircuit_id!
    const { name, traceWidth, priority } = this._parsedProps
    if (
      db.source_net_class
        .list()
        .some(
          (netClass) =>
            netClass.name === name && netClass.subcircuit_id === subcircuit_id,
        )
    ) {
      throw new Error(
        `Net class "${name}" is defined more than once in the same subcircuit`,
      )
    }
    this.source_net_class_id = db.source_net_class.insert({
      name,
      trace_width: traceWidth,
      priority,
      subcircuit_id,
    }).source_net_class_id
  }
}
