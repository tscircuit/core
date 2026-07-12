import { mosfetProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import { getMosfetSchematicSymbolName } from "./get-mosfet-schematic-symbol-name"

export class Mosfet extends NormalComponent<typeof mosfetProps> {
  get config() {
    return {
      componentName: "Mosfet",
      schematicSymbolName: (this.props.symbolName ??
        getMosfetSchematicSymbolName(this.props)) as BaseSymbolName,
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
