import { mosfetProps, transistorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

export class Mosfet extends NormalComponent<typeof mosfetProps> {
  get config() {
    const mosfetMode = this.props.mosfetMode === "depletion" ? "d" : "e"
    const channelType = this.props.channelType
    const baseSymbolName: BaseSymbolName = `${channelType}_channel_${mosfetMode}_mosfet_transistor`

    return {
      componentName: "Mosfet",
      schematicSymbolName: baseSymbolName,
      zodProps: mosfetProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_mosfet",
      name: props.name,
      mosfet_mode: props.mosfetMode,
      channel_type: props.channelType,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
