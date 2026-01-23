import { mosfetProps, transistorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

export class Mosfet extends NormalComponent<typeof mosfetProps> {
  get config() {
    const mosfetMode = this.props.mosfetMode === "depletion" ? "d" : "e"
    const channelType = this.props.channelType
    const baseSymbolName: BaseSymbolName = `${channelType}_channel_${mosfetMode}_mosfet_transistor`

    return {
      componentName: "Mosfet",
      schematicSymbolName: (this.props.symbolName ??
        baseSymbolName) as BaseSymbolName,
      zodProps: mosfetProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_mosfet",
      name: this.name,
      mosfet_mode: props.mosfetMode,
      channel_type: props.channelType,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
