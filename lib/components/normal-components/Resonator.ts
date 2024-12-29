import { resonatorProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent"
import type { BaseSymbolName } from "lib/utils/constants"

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
    const source_component = db.source_component.insert({
      ftype: "simple_resonator",
      name: props.name,
      frequency: props.frequency,
      load_capacitance: props.loadCapacitance,
      supplier_part_numbers: props.supplierPartNumbers,
      pin_variant: props.pinVariant || "no_ground",
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
