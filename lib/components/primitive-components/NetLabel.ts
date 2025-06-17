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

    const netLabel = db.schematic_net_label.insert({
      text: props.net ?? "",
      source_net_id: props.net ?? undefined,
      anchor_position: anchorPos,
      center: anchorPos,
      anchor_side: "bottom",
    })

    this.source_net_label_id = netLabel.source_net_id
  }
}
