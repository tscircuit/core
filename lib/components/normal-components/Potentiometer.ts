import { potentiometerProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import { formatSiUnit } from "format-si-unit"

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
  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.maxResistance)}Ω`
  }
  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const pinVariant = props.pinVariant || "two_pin"
    const source_component = db.source_component.insert({
      ftype: "simple_potentiometer",
      name: this.name,
      max_resistance: props.maxResistance,
      pin_variant: pinVariant,
      are_pins_interchangeable: pinVariant === "two_pin",
      display_name: props.displayName,
      display_max_resistance: this._getSchematicSymbolDisplayValue(),
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
