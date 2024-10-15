import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const netAliasProps = z.object({
  net: z.string(),
})

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

    const netAlias = db.schematic_net_label.insert({
      text: props.net,
      source_net_id: props.net,
      center: { x: 0, y: 0 },
      anchor_side: "bottom",
    })

    this.source_net_alias_id = netAlias.source_net_id
  }
}
