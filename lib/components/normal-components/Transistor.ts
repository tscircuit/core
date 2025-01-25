import { transistorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

export class Transistor extends NormalComponent<typeof transistorProps> {
  get config() {
    const baseSymbolName: BaseSymbolName =
      this.props.transistorType === "npn"
        ? "npn_bipolar_transistor"
        : "pnp_bipolar_transistor"

    return {
      componentName: "Transistor",
      schematicSymbolName: baseSymbolName,
      zodProps: transistorProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_transistor",
      name: props.name,
      transistor_type: props.transistorType,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
