import { netAliasProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"

export class NetAlias extends PrimitiveComponent<typeof netAliasProps> {
  source_net_alias_id?: string

  get config() {
    return {
      componentName: "NetAlias",
      zodProps: netAliasProps,
    }
  }

  doInitialSchematicComponentRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const anchorPos = { x: props.schX ?? 0, y: props.schY ?? 0 }

    const netAlias = db.schematic_net_label.insert({
      text: props.net!,
      source_net_id: props.net!,
      anchor_position: anchorPos,

      // TODO compute the center based on the text size
      center: anchorPos,
      anchor_side: "bottom",
    })

    this.source_net_alias_id = netAlias.source_net_id
  }
}
