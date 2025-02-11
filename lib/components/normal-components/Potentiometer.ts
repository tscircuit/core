import { potentiometerProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

function getPotentiometerSymbolName(
  variant: string | undefined,
): BaseSymbolName {
  switch (variant) {
    case "three_pin":
      return "potentiometer3"
    case "two_pin":
      return "potentiometer2"
    default:
      return "potentiometer2"
  }
}

export class Potentiometer extends NormalComponent<typeof potentiometerProps> {
  get config() {
    return {
      componentName: "Potentiometer",
      schematicSymbolName:
        this.props.symbolName ??
        getPotentiometerSymbolName(this.props.pinVariant),
      zodProps: potentiometerProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_potentiometer",
      name: props.name,
      max_resistance: props.maxResistance,
      pin_variant: props.pinVariant || "two_pin",
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
