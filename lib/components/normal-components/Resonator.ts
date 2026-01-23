import { resonatorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"
import { formatSiUnit } from "format-si-unit"

function getResonatorSymbolName(variant: string | undefined): BaseSymbolName {
  switch (variant) {
    case "two_ground_pins":
      return `crystal_4pin`
    case "ground_pin":
      return "resonator"
    case "no_ground":
      return "crystal"
    default:
      return "crystal"
  }
}

export class Resonator extends NormalComponent<typeof resonatorProps> {
  get config() {
    return {
      componentName: "Resonator",
      schematicSymbolName:
        this.props.symbolName ?? getResonatorSymbolName(this.props.pinVariant),
      zodProps: resonatorProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const pinVariant = props.pinVariant || "no_ground"
    const source_component = db.source_component.insert({
      ftype: "simple_resonator",
      name: this.name,
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
      supplier_part_numbers: props.supplierPartNumbers,
      pin_variant: pinVariant,
      are_pins_interchangeable:
        pinVariant === "no_ground" || pinVariant === "ground_pin",
      display_name: props.displayName,
    } as any)

    this.source_component_id = source_component.source_component_id
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const freqDisplay = `${formatSiUnit(this._parsedProps.frequency)}Hz`
    if (this._parsedProps.loadCapacitance) {
      return `${freqDisplay} / ${formatSiUnit(this._parsedProps.loadCapacitance)}F`
    }
    return freqDisplay
  }
}
