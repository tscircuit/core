import { netAliasProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/**
 * @deprecated Use <netlabel /> instead.
 */
export class NetAlias extends PrimitiveComponent<typeof netAliasProps> {
  source_net_alias_id?: string

  get config() {
    return {
      componentName: "NetAlias",
      zodProps: netAliasProps,
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

    const netAlias = db.schematic_net_label.insert({
      text: props.net!,
      source_net_id,
      anchor_position: anchorPos,

      // TODO compute the center based on the text size
      center: anchorPos,
      anchor_side: "bottom",
    })

    this.source_net_alias_id = netAlias.source_net_id
  }
}
