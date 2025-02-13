import { switchProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import { z } from "zod"

// Extend the SwitchProps type to include spst, spdt, dpst, and dpdt as optional boolean properties
export interface ExtendedSwitchProps extends z.infer<typeof switchProps> {
  spst?: boolean
  spdt?: boolean
  dpst?: boolean
  dpdt?: boolean
}

// Modify the Switch class to use ExtendedSwitchProps
export class Switch extends NormalComponent<typeof switchProps> {
  // Ensure props are correctly typed as ExtendedSwitchProps
  get config() {
    let baseSymbolName: BaseSymbolName

    // Destructure the boolean flags from the props
    const { spst, spdt, dpst, dpdt, type } = this.props as ExtendedSwitchProps

    let switchType: "spst" | "spdt" | "dpst" | "dpdt" | undefined = undefined

    // Set the switch type based on the boolean flags (if provided)
    if (spst) {
      switchType = "spst"
    } else if (spdt) {
      switchType = "spdt"
    } else if (dpst) {
      switchType = "dpst"
    } else if (dpdt) {
      switchType = "dpdt"
    }

    // Fallback to 'type' prop if no boolean flags are set
    switchType = switchType ?? type ?? "dpdt" // Default to 'dpdt' if neither are provided

    // Set the appropriate schematic name based on the type
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

    // Ensure correct fallback for 'isNormallyClosed' if not explicitly set
    const source_component = db.source_component.insert({
      ftype: "simple_switch",
      name: props.name,
      switch_type: props.type,
      is_normally_closed: props.isNormallyClosed ?? false, // Fallback to false if not provided
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
