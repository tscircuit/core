import { netLabelProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/**
 * Create a schematic net label referencing a net.
 */
export class NetLabel extends PrimitiveComponent<typeof netLabelProps> {
  source_net_label_id?: string

  get config() {
    return {
      componentName: "NetLabel",
      zodProps: netLabelProps,
    }
  }

  doInitialSchematicComponentRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const anchorPos = { x: props.schX ?? 0, y: props.schY ?? 0 }

    const subcircuit = this.getSubcircuit()

    let source_net_id: string | undefined

    if (props.connection) {
      const net = subcircuit?.selectOne(props.connection, { type: "net" }) as
        | import("./Net").Net
        | null
      if (net) {
        source_net_id = net.source_net_id
      } else {
        const port = subcircuit?.selectOne(props.connection, {
          type: "port",
        }) as import("./Port").Port | null
        if (port) {
          const trace = db.source_trace
            .list()
            .find((st) =>
              st.connected_source_port_ids.includes(port.source_port_id!),
            )
          source_net_id = trace?.connected_source_net_ids[0]
        } else {
          this.renderError(
            `Could not find connection target "${props.connection}"`,
          )
        }
      }
    } else if (props.net) {
      const net = subcircuit?.selectOne(`net.${props.net}`, {
        type: "net",
      }) as import("./Net").Net | null
      source_net_id = net?.source_net_id
    }

    const netLabel = db.schematic_net_label.insert({
      text: props.net ?? "",
      source_net_id,
      anchor_position: anchorPos,
      center: anchorPos,
      anchor_side: "bottom",
    })

    this.source_net_label_id = netLabel.source_net_id
  }
}
