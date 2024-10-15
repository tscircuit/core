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

  initPorts() {
    this.add(
      new Port({
        name: "pin1",
        pinNumber: 1,
        aliases: ["anode", "pos", "left"],
      }),
    )
  }

  doInitialSchematicComponentRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const netAlias = db.schematic_net_label.insert({
      text: props.net!,
      source_net_id: props.net!,
      center: { x: props.schX ?? 0, y: props.schY ?? 0 },
      anchor_side: "bottom",
    })

    this.source_net_alias_id = netAlias.source_net_id
  }
}
