import { switchProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import { z } from "zod"

export interface ExtendedSwitchProps extends z.infer<typeof switchProps> {
  spst?: boolean
  spdt?: boolean
  dpst?: boolean
  dpdt?: boolean
}

export class Switch extends NormalComponent<typeof switchProps> {
  get config() {
    let baseSymbolName: BaseSymbolName

    const { spst, spdt, dpst, dpdt, type } = this.props as ExtendedSwitchProps

    let switchType: "spst" | "spdt" | "dpst" | "dpdt" = "spst"

    if (spst) {
      switchType = "spst"
    } else if (spdt) {
      switchType = "spdt"
    } else if (dpst) {
      switchType = "dpst"
    } else if (dpdt) {
      switchType = "dpdt"
    } else if (type) {
      switchType = type
    }

    switch (switchType) {
      case "spst":
        baseSymbolName = "SPST_switch"
        break
      case "spdt":
        baseSymbolName = "SPDT_switch"
        break
      case "dpst":
        baseSymbolName = "dpst_switch"
        break
      case "dpdt":
        baseSymbolName = "dpdt_switch"
        break
      default:
        baseSymbolName = "SPST_switch"
        break
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
      is_normally_closed: props.isNormallyClosed ?? false,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
