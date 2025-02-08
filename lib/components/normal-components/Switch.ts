import { switchProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

export class Switch extends NormalComponent<typeof switchProps> {
  get config() {
    const baseSymbolName: BaseSymbolName =
      this.props.type === "spst"
        ? "SPST_switch"
        : this.props.type === "spdt"
          ? "SPDT_switch"
          : this.props.type === "dpst"
            ? "dpst_switch"
            : "dpdt_switch"

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
      ftype: "switch",
      name: props.name,
      switch_type: props.type,
      is_normally_closed: props.isNormallyClosed,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
