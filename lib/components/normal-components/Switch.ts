import { switchProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

export class Switch extends NormalComponent<typeof switchProps> {
  get config() {
    let baseSymbolName: BaseSymbolName

    if (this.props.type === "spst") {
      baseSymbolName = "SPST_switch"
    } else if (this.props.type === "spdt") {
      baseSymbolName = "SPDT_switch"
    } else if (this.props.type === "dpst") {
      baseSymbolName = "dpst_switch"
    } else {
      baseSymbolName = "dpdt_switch"
    }

    return {
      componentName: "Switch",
      schematicSymbolName: baseSymbolName,
      zodProps: switchProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_switch",
      name: props.name,
      switch_type: props.type,
      is_normally_closed: props.isNormallyClosed,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
